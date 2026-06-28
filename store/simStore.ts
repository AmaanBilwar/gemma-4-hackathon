import { create } from "zustand";
import { cloneSeedAgents, INITIAL_HEALTH } from "@/lib/sim/agents";
import { applyAction } from "@/lib/sim/applyAction";
import { mockDecide } from "@/lib/sim/mockEngine";
import type { EventTemplate } from "@/lib/sim/events";
import type {
  Agent,
  AgentAction,
  CompanyHealth,
  DecisionContext,
  Message,
  SimEvent,
} from "@/lib/sim/types";

export const TICK_MS = 2500;
const MESSAGE_LOG_LIMIT = 50;
const EVENT_LOG_LIMIT = 20;

interface SimState {
  agents: Agent[];
  health: CompanyHealth;
  events: SimEvent[];
  messages: Message[]; // chronological log for the UI
  pending: Message[]; // produced last tick, delivered to inboxes next tick
  tick: number;
  isRunning: boolean;
  mockMode: boolean;
  busy: boolean;

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

/** Ask the server (Gemma) for a decision; fall back to the mock engine on error. */
async function apiDecide(ctx: DecisionContext): Promise<AgentAction> {
  try {
    const res = await fetch("/api/agents/decide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ctx),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "decide failed");
    return data.action as AgentAction;
  } catch {
    return mockDecide(ctx);
  }
}

export const useSimStore = create<SimState>((set, get) => ({
  agents: cloneSeedAgents(),
  health: { ...INITIAL_HEALTH },
  events: [],
  messages: [],
  pending: [],
  tick: 0,
  isRunning: false,
  mockMode: true,
  busy: false,

  start: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false }),
  reset: () =>
    set({
      agents: cloneSeedAgents(),
      health: { ...INITIAL_HEALTH },
      events: [],
      messages: [],
      pending: [],
      tick: 0,
      isRunning: false,
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
      const { agents, health, pending, events, tick, mockMode } = get();
      const nextTick = tick + 1;
      const roster = agents.map((a) => ({ id: a.id, name: a.name, role: a.role }));
      const recentEvents = events.slice(-3);

      const inboxByAgent = new Map<string, Message[]>();
      for (const m of pending) {
        const list = inboxByAgent.get(m.to) ?? [];
        list.push(m);
        inboxByAgent.set(m.to, list);
      }

      // Clear last tick's speech bubbles before agents act.
      const fresh = agents.map((a) => ({ ...a, speech: "" }));

      const decisions = await Promise.all(
        fresh.map(async (agent) => {
          const ctx: DecisionContext = {
            agent,
            health,
            recentEvents,
            inbox: inboxByAgent.get(agent.id) ?? [],
            roster,
            tick: nextTick,
          };
          const action = mockMode ? mockDecide(ctx) : await apiDecide(ctx);
          return { id: agent.id, action };
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

      set({
        agents: curAgents,
        health: clampHealth(curHealth),
        pending: produced,
        messages: [...get().messages, ...produced].slice(-MESSAGE_LOG_LIMIT),
        tick: nextTick,
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
