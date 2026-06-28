"use client";

import { useSimStore } from "@/store/simStore";
import { EVENT_TEMPLATES } from "@/lib/sim/events";

export function EventPanel() {
  const injectEvent = useSimStore((s) => s.injectEvent);
  const events = useSimStore((s) => s.events);
  const messages = useSimStore((s) => s.messages);
  const agents = useSimStore((s) => s.agents);

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Inject an Event</h2>
      <div className="flex flex-wrap gap-2">
        {EVENT_TEMPLATES.map((t) => (
          <button
            key={t.title}
            onClick={() => injectEvent(t)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
          >
            {t.title}
          </button>
        ))}
      </div>

      <h3 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Activity
      </h3>
      <div className="max-h-56 space-y-1 overflow-y-auto text-xs">
        {events.length === 0 && messages.length === 0 && (
          <p className="text-slate-600">
            Start the simulation and inject an event to see agents react.
          </p>
        )}
        {events.map((e) => (
          <p key={e.id} className="text-amber-300">
            ⚡ <span className="font-medium">{e.title}</span>
          </p>
        ))}
        {messages
          .slice()
          .reverse()
          .map((m) => (
            <p key={m.id} className="text-slate-300">
              <span className="text-slate-500">{nameOf(m.from)} →</span> {nameOf(m.to)}: {m.text}
            </p>
          ))}
      </div>
    </div>
  );
}
