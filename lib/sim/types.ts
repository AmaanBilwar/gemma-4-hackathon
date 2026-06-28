import { z } from "zod";

export type Role = "CEO" | "CTO" | "Engineer" | "Product Manager" | "Sales" | "Security" | "HR";

export type Mood = "happy" | "neutral" | "stressed" | "angry" | "focused" | "worried";

/** A location is either an agent's id (standing at that desk) or the meeting room. */
export type Location = string; // agent id | "meeting"

export interface Agent {
  id: string;
  name: string;
  role: Role;
  personality: string;
  goals: string[];
  /** Short notes about each coworker (id -> note), fed into the agent's prompt. */
  relationships: Record<string, string>;
  /** Short rolling log of recent observations/messages (most recent last). */
  memory: string[];
  /** Free-text description of what the agent is doing right now. */
  currentTask: string;
  location: Location;
  mood: Mood;
  /** Transient line said out loud; shown as a 💬 speech bubble. */
  speech: string;
  /** First-person internal monologue; shown as a 💭 thought bubble. */
  thought: string;
}

export interface CompanyHealth {
  revenue: number; // 0-100
  security: number; // 0-100
  morale: number; // 0-100 (employee morale)
  runway: number; // 0-100 (financial runway)
  customerTrust: number; // 0-100
}

export interface SimEvent {
  id: string;
  tick: number;
  title: string;
  description: string;
  /** Health deltas applied immediately when the event is injected. */
  effects: Partial<CompanyHealth>;
}

export interface Message {
  id: string;
  tick: number;
  from: string; // agent id
  to: string; // agent id
  text: string;
}

/** The structured decision every agent returns each tick. */
export const AGENT_ACTIONS = [
  "message_agent",
  "move",
  "create_task",
  "update_state",
  "call_meeting",
] as const;

export const agentActionSchema = z.object({
  action: z.enum(AGENT_ACTIONS),
  target_agent: z.string().describe("Target agent id, or empty string if not applicable"),
  message: z.string().describe("What the agent says out loud to the target; may be empty"),
  emotion: z.enum(["happy", "neutral", "stressed", "angry", "focused", "worried"]),
  thought: z.string().describe("First-person internal monologue explaining how you feel and why"),
});

export type AgentAction = z.infer<typeof agentActionSchema>;

/** A back-and-forth dialogue thread between two agents. */
export interface Conversation {
  id: string;
  participants: [string, string]; // agent ids
  lines: { tick: number; from: string; text: string }[];
  open: boolean;
  lastTick: number;
}

/** Context handed to an agent each tick so it can decide what to do. */
export interface DecisionContext {
  agent: Agent;
  health: CompanyHealth;
  recentEvents: SimEvent[];
  inbox: Message[]; // messages addressed to this agent since last tick
  roster: { id: string; name: string; role: Role }[];
  /** The dialogue so far in the agent's active conversation, if any. */
  activeConversation: { from: string; text: string }[];
  tick: number;
}
