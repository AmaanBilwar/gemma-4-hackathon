import { create } from "zustand";
import { cloneSeedAgents, INITIAL_HEALTH } from "@/lib/sim/agents";
import { applyAction } from "@/lib/sim/applyAction";
import { mockDecide } from "@/lib/sim/mockEngine";
import type { EventTemplate } from "@/lib/sim/events";
import type {
  Agent,
  AgentAction,
  CompanyHealth,
  Conversation,
  DecisionContext,
  Message,
  SimEvent,
} from "@/lib/sim/types";

export const TICK_MS = 2500;
const MESSAGE_LOG_LIMIT = 50;
const EVENT_LOG_LIMIT = 20;
const CONVO_LOG_LIMIT = 12;
/** Max lines before a dialogue thread wraps up (mirrors rat-agents' 6 exchanges). */
const MAX_CONVO_LINES = 6;

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

/** Find the currently-open conversation between two agents, if any. */
function openConvoBetween(convos: Conversation[], a: string, b: string) {
  const key = pairKey(a, b);
  return convos.find((c) => c.open && pairKey(...c.participants) === key);
}

/** Thread a produced message into a conversation, opening or closing as needed. */
function threadMessage(convos: Conversation[], msg: Message, tick: number): Conversation[] {
  const next = convos.map((c) => ({ ...c, lines: [...c.lines] }));
  let convo = openConvoBetween(next, msg.from, msg.to);
  if (!convo) {
    convo = {
      id: `c${tick}-${msg.from}-${msg.to}`,
      participants: [msg.from, msg.to],
      lines: [],
      open: true,
      lastTick: tick,
    };
    next.push(convo);
  }
  convo.lines.push({ tick, from: msg.from, text: msg.text });
  convo.lastTick = tick;
  if (convo.lines.length >= MAX_CONVO_LINES) convo.open = false;
  return next.slice(-CONVO_LOG_LIMIT);
}

interface SimState {
  agents: Agent[];
  health: CompanyHealth;
  events: SimEvent[];
  messages: Message[]; // chronological log for the UI
  conversations: Conversation[]; // threaded dialogue between agents
  pending: Message[]; // produced last tick, delivered to inboxes next tick
  tick: number;
  isRunning: boolean;
  mockMode: boolean;
  busy: boolean;
  /** Cumulative count of decisions that actually came back from Gemma. */
  liveDecisions: number;
  /** Last error from a failed Gemma call (cleared on a clean tick). */
  lastError: string | null;

  start: () => void;
  stop: () => void;
  reset: () => void;
  setMockMode: (on: boolean) => void;
  injectEvent: (template: EventTemplate) => void;
  runTick: () => Promise<void>;
  chatWithAgent: (agentId: string, text: string) => Promise<string>;
}

function clampHealth(h: CompanyHealth): CompanyHealth {
  const c = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return {
    revenue: c(h.revenue),
    security: c(h.security),
    morale: c(h.morale),
    runway: c(h.runway),
    customerTrust: c(h.customerTrust),
  };
}

interface DecideResult {
  action: AgentAction;
  live: boolean; // true if it actually came from Gemma
  error: string | null;
}

/** Ask the server (Gemma) for a decision; fall back to the mock engine on error. */
async function apiDecide(ctx: DecisionContext): Promise<DecideResult> {
  try {
    const res = await fetch("/api/agents/decide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ctx),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "decide failed");
    return { action: data.action as AgentAction, live: true, error: null };
  } catch (e) {
    return { action: mockDecide(ctx), live: false, error: String(e) };
  }
}

export const useSimStore = create<SimState>((set, get) => ({
  agents: cloneSeedAgents(),
  health: { ...INITIAL_HEALTH },
  events: [],
  messages: [],
  conversations: [],
  pending: [],
  tick: 0,
  isRunning: false,
  mockMode: true,
  busy: false,
  liveDecisions: 0,
  lastError: null,

  start: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false }),
  reset: () =>
    set({
      agents: cloneSeedAgents(),
      health: { ...INITIAL_HEALTH },
      events: [],
      messages: [],
      conversations: [],
      pending: [],
      tick: 0,
      isRunning: false,
      liveDecisions: 0,
      lastError: null,
    }),
  setMockMode: (on) => set({ mockMode: on }),

  injectEvent: (template) => {
    const { tick, events, health } = get();
    const event: SimEvent = {
      id: `${tick}-${template.title}`,
      tick,
      title: template.title,
      description: template.description,
      effects: template.effects,
    };
    set({
      events: [...events, event].slice(-EVENT_LOG_LIMIT),
      health: clampHealth({ ...health, ...mergeEffects(health, template.effects) }),
    });
  },

  runTick: async () => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const { agents, health, pending, events, conversations, tick, mockMode } = get();
      const nextTick = tick + 1;
      const roster = agents.map((a) => ({ id: a.id, name: a.name, role: a.role }));
      const recentEvents = events.slice(-3);

      // Only deliver a message if its conversation is still open (turn cap),
      // so dialogue threads wrap up instead of looping forever.
      const inboxByAgent = new Map<string, Message[]>();
      for (const m of pending) {
        if (!openConvoBetween(conversations, m.from, m.to)) continue;
        const list = inboxByAgent.get(m.to) ?? [];
        list.push(m);
        inboxByAgent.set(m.to, list);
      }

      // Clear last tick's speech bubbles before agents act.
      const fresh = agents.map((a) => ({ ...a, speech: "" }));

      const decisions = await Promise.all(
        fresh.map(async (agent) => {
          const convo = conversations.find((c) => c.open && c.participants.includes(agent.id));
          const ctx: DecisionContext = {
            agent,
            health,
            recentEvents,
            inbox: inboxByAgent.get(agent.id) ?? [],
            roster,
            activeConversation: convo
              ? convo.lines.map((l) => ({ from: l.from, text: l.text }))
              : [],
            tick: nextTick,
          };
          if (mockMode) return { id: agent.id, action: mockDecide(ctx), live: false, error: null };
          const r = await apiDecide(ctx);
          return { id: agent.id, action: r.action, live: r.live, error: r.error };
        }),
      );

      let curAgents = fresh;
      let curHealth = health;
      const produced: Message[] = [];
      for (const { id, action } of decisions) {
        const res = applyAction(curAgents, curHealth, id, action, nextTick);
        curAgents = res.agents;
        curHealth = res.health;
        produced.push(...res.newMessages);
      }

      // Thread produced messages into conversation dialogue threads.
      let curConvos = conversations;
      for (const m of produced) curConvos = threadMessage(curConvos, m, nextTick);

      // Track whether Gemma actually answered this tick (vs silent fallback).
      const liveThisTick = decisions.filter((d) => d.live).length;
      const errThisTick = decisions.find((d) => d.error)?.error ?? null;

      set({
        agents: curAgents,
        health: clampHealth(curHealth),
        conversations: curConvos,
        pending: produced,
        messages: [...get().messages, ...produced].slice(-MESSAGE_LOG_LIMIT),
        tick: nextTick,
        liveDecisions: get().liveDecisions + liveThisTick,
        lastError: mockMode ? null : errThisTick,
      });
    } finally {
      set({ busy: false });
    }
  },

  chatWithAgent: async (agentId, text) => {
    const agent = get().agents.find((a) => a.id === agentId);
    if (!agent) return "";
    if (get().mockMode) {
      return `${agent.name} (${agent.role}): On it — I'll keep that in mind.`;
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent, message: text }),
      });
      const data = await res.json();
      return data.ok ? (data.reply as string) : "(no reply)";
    } catch {
      return "(chat failed)";
    }
  },
}));

function mergeEffects(health: CompanyHealth, effects: Partial<CompanyHealth>): CompanyHealth {
  const out = { ...health };
  for (const key of Object.keys(effects) as (keyof CompanyHealth)[]) {
    out[key] = health[key] + (effects[key] ?? 0);
  }
  return out;
}
