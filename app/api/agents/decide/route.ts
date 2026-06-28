import { decide } from "@/lib/sim/decide";
import type { DecisionContext } from "@/lib/sim/types";

/** POST: send an agent's DecisionContext to Gemma, return a structured action. */
export async function POST(request: Request) {
  try {
    const ctx = (await request.json()) as DecisionContext;
    const action = await decide(ctx);
    return Response.json({ ok: true, action });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
