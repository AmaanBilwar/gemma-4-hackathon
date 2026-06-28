"use client";

import { useSimStore } from "@/store/simStore";

export function ConversationsView() {
  const conversations = useSimStore((s) => s.conversations);
  const agents = useSimStore((s) => s.agents);

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? id;
  const ordered = conversations.slice().reverse();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Conversations</h2>
      {ordered.length === 0 && (
        <p className="text-xs text-slate-600">
          No conversations yet. Start the sim and inject an event — agents will start talking to
          each other.
        </p>
      )}
      <div className="max-h-80 space-y-3 overflow-y-auto">
        {ordered.map((c) => {
          const [a, b] = c.participants;
          return (
            <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {nameOf(a)} ↔ {nameOf(b)}
                </span>
                <span>{c.open ? "💬 active" : "✓ wrapped up"}</span>
              </div>
              <div className="space-y-1.5">
                {c.lines.map((line, i) => {
                  const mine = line.from === a;
                  return (
                    <div key={i} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs ${
                          mine ? "bg-slate-800 text-slate-200" : "bg-sky-900/70 text-sky-100"
                        }`}
                      >
                        <span className="mb-0.5 block text-[10px] text-slate-400">
                          {nameOf(line.from)}
                        </span>
                        {line.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
