import { EVENT_TEMPLATES, randomEventTemplate } from "@/lib/sim/events";

/** GET: list the available event templates the UI can inject. */
export async function GET() {
  return Response.json({ ok: true, templates: EVENT_TEMPLATES });
}

/** POST: pick a random crisis event (optionally seeded) to inject. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const seed = typeof body.seed === "number" ? body.seed : Date.now();
  return Response.json({ ok: true, template: randomEventTemplate(seed) });
}
