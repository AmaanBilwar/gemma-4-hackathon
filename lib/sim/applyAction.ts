import type { Agent, AgentAction, CompanyHealth, Message } from "@/lib/sim/types";

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const MEMORY_LIMIT = 8;

export interface ApplyResult {
  agents: Agent[];
  health: CompanyHealth;
  newMessages: Message[];
}

/**
 * Pure reducer: given the acting agent's decision, return updated agents,
 * company health, and any messages produced. Deterministic and simple so the
 * dashboard moves in believable ways without complex modeling.
 */
export function applyAction(
  agents: Agent[],
  health: CompanyHealth,
  actorId: string,
  action: AgentAction,
  tick: number,
): ApplyResult {
  const next = agents.map((a) => ({ ...a, memory: [...a.memory] }));
  const actor = next.find((a) => a.id === actorId);
  const newMessages: Message[] = [];
  const nextHealth = { ...health };

  if (!actor) return { agents: next, health: nextHealth, newMessages };

  // Mood always reflects the agent's expressed emotion this tick.
  actor.mood = action.emotion;
  actor.speech = "";
  remember(actor, `(${tick}) ${action.reasoning}`);

  switch (action.action) {
    case "message_agent": {
      const target = next.find((a) => a.id === action.target_agent);
      if (target && action.message) {
        actor.speech = action.message;
        newMessages.push({
          id: `${tick}-${actor.id}-${target.id}`,
          tick,
          from: actor.id,
          to: target.id,
          text: action.message,
        });
        remember(target, `(${tick}) ${actor.name}: ${action.message}`);
      }
      break;
    }
    case "move": {
      // Walk to the target agent's desk (or stay if none specified).
      if (action.target_agent && next.some((a) => a.id === action.target_agent))
        actor.location = action.target_agent;
      if (action.message) actor.speech = action.message;
      break;
    }
    case "create_task": {
      if (action.message) actor.currentTask = action.message;
      break;
    }
    case "update_state": {
      if (action.message) actor.currentTask = action.message;
      break;
    }
    case "call_meeting": {
      // Everyone gathers in the meeting room.
      for (const a of next) a.location = "meeting";
      if (action.message) actor.speech = action.message;
      break;
    }
  }

  applyHealthDrift(actor, action, nextHealth);

  return {
    agents: next,
    health: { ...nextHealth },
    newMessages,
  };
}

function remember(agent: Agent, line: string) {
  agent.memory = [...agent.memory, line].slice(-MEMORY_LIMIT);
}

/** Small, deterministic nudges to company health based on who did what. */
function applyHealthDrift(actor: Agent, action: AgentAction, health: CompanyHealth) {
  const productive = action.action === "create_task" || action.action === "update_state";

  switch (actor.role) {
    case "Sales":
      if (productive) health.revenue = clamp(health.revenue + 2);
      break;
    case "Security":
      if (productive) health.security = clamp(health.security + 2);
      break;
    case "Engineer":
      if (productive) health.security = clamp(health.security + 1);
      break;
    case "HR":
      health.morale = clamp(health.morale + 1);
      break;
    case "Product Manager":
      if (productive) health.customerTrust = clamp(health.customerTrust + 1);
      break;
    case "CEO":
      if (action.action === "call_meeting") health.morale = clamp(health.morale + 2);
      break;
    default:
      break;
  }

  // Stress costs morale a little; calm focus slowly recovers runway.
  if (action.emotion === "stressed" || action.emotion === "angry")
    health.morale = clamp(health.morale - 1);
}
