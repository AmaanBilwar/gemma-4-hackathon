"use client";

import { useSimStore } from "@/store/simStore";
import { MOOD_EMOJI, MOOD_TEXT, locationLabel } from "@/lib/sim/ui";

export function AgentSidebar() {
  const agents = useSimStore((s) => s.agents);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Employees</h2>
      <div className="space-y-2">
        {agents.map((a) => (
          <div key={a.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-100">{a.name}</span>
              <span className={`text-lg ${MOOD_TEXT[a.mood]}`} title={a.mood}>
                {MOOD_EMOJI[a.mood]}
              </span>
            </div>
            <div className="text-xs text-slate-400">{a.role}</div>
            <div className="mt-1 text-xs text-slate-300">{a.currentTask}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              📍 {locationLabel(a.location, a.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
