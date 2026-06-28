import { generateText, Output } from "ai";
import { model } from "@/lib/ai/model";
import { agentActionSchema } from "@/lib/sim/types";
import type { AgentAction, DecisionContext } from "@/lib/sim/types";

/** Build the per-tick prompt from the agent's view of the world. */
export function buildPrompt(ctx: DecisionContext): string {
  const { agent, health, recentEvents, inbox, roster } = ctx;
  const others = roster
    .filter((r) => r.id !== agent.id)
    .map((r) => `- ${r.id} (${r.name}, ${r.role})`)
    .join("\n");
  const events = recentEvents.length
    ? recentEvents.map((e) => `- ${e.title}: ${e.description}`).join("\n")
    : "- (none)";
  const messages = inbox.length
    ? inbox.map((m) => `- from ${m.from}: ${m.text}`).join("\n")
    : "- (none)";
  const memory = agent.memory.length
    ? agent.memory.map((m) => `- ${m}`).join("\n")
    : "- (nothing yet)";

  return `You are ${agent.name}, the ${agent.role} of a startup.
Personality: ${agent.personality}
Your goals: ${agent.goals.join("; ")}.

Company health (0-100): revenue ${health.revenue}, security ${health.security}, morale ${health.morale}, runway ${health.runway}, customer trust ${health.customerTrust}.

Coworkers you can message or move to (use their id):
${others}
(Use "meeting" only via the call_meeting action.)

Recent events:
${events}

Messages addressed to you:
${messages}

Your recent memory:
${memory}

Decide your single next action. Stay in character and react to what matters most right now. Keep messages short (one sentence).`;
}

/** Run one structured decision through Gemma 4 31B (Cerebras). */
export async function decide(ctx: DecisionContext): Promise<AgentAction> {
  const result = await generateText({
    model,
    system:
      "You are an employee inside a live company simulation. You always respond with exactly one structured action.",
    prompt: buildPrompt(ctx),
    output: Output.object({
      schema: agentActionSchema,
      name: "AgentAction",
      description: "The single action this agent takes this tick.",
    }),
  });

  return result.output;
}
