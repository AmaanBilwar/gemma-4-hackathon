import { generateText } from "ai";
import { model } from "@/lib/ai/model";
import type { Agent } from "@/lib/sim/types";

interface ChatBody {
  agent: Agent;
  message: string;
}

/** POST: the user sends a direct message to one agent and gets a reply. */
export async function POST(request: Request) {
  try {
    const { agent, message } = (await request.json()) as ChatBody;

    const result = await generateText({
      model,
      system: `You are ${agent.name}, the ${agent.role} of a startup. Personality: ${agent.personality}. Goals: ${agent.goals.join("; ")}. Reply in character, briefly (1-2 sentences).`,
      prompt: `Recent context:\n${agent.memory.join("\n") || "(none)"}\n\nThe user (your founder) says: "${message}"`,
    });

    return Response.json({ ok: true, reply: result.text });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
