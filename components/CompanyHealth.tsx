"use client";

import { useSimStore } from "@/store/simStore";
import type { CompanyHealth as Health } from "@/lib/sim/types";

const METRICS: { key: keyof Health; label: string; color: string }[] = [
  { key: "revenue", label: "Revenue", color: "bg-emerald-500" },
  { key: "security", label: "Security", color: "bg-sky-500" },
  { key: "morale", label: "Morale", color: "bg-amber-500" },
  { key: "runway", label: "Runway", color: "bg-violet-500" },
  { key: "customerTrust", label: "Customer Trust", color: "bg-rose-500" },
];

export function CompanyHealth() {
  const health = useSimStore((s) => s.health);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Company Health</h2>
      <div className="space-y-3">
        {METRICS.map((m) => {
          const value = health[m.key];
          return (
            <div key={m.key}>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{m.label}</span>
                <span className="tabular-nums">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full ${m.color} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
