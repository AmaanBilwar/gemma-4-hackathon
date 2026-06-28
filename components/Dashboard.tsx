"use client";

import { useSimStore } from "@/store/simStore";
import { useSimulationLoop } from "@/hooks/useSimulationLoop";
import { OfficeCanvas } from "@/components/OfficeCanvas";
import { AgentSidebar } from "@/components/AgentSidebar";
import { CompanyHealth } from "@/components/CompanyHealth";
import { EventPanel } from "@/components/EventPanel";
import { ConversationsView } from "@/components/ConversationsView";
import { ChatPanel } from "@/components/ChatPanel";

export function Dashboard() {
  useSimulationLoop();

  const isRunning = useSimStore((s) => s.isRunning);
  const mockMode = useSimStore((s) => s.mockMode);
  const tick = useSimStore((s) => s.tick);
  const liveDecisions = useSimStore((s) => s.liveDecisions);
  const lastError = useSimStore((s) => s.lastError);
  const start = useSimStore((s) => s.start);
  const stop = useSimStore((s) => s.stop);
  const reset = useSimStore((s) => s.reset);
  const setMockMode = useSimStore((s) => s.setMockMode);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">AI Company Simulator</h1>
            <p className="text-xs text-slate-400">
              Tick {tick} ·{" "}
              {mockMode ? (
                "Mock mode (no AI)"
              ) : (
                <span className="text-emerald-400">
                  ● Gemma 4 31B · {liveDecisions} live decisions
                </span>
              )}
            </p>
            {!mockMode && lastError && (
              <p className="mt-0.5 max-w-md truncate text-[11px] text-rose-400">
                ⚠ Gemma call failed (used mock fallback): {lastError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isRunning ? stop : start}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isRunning ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm transition hover:bg-slate-700"
            >
              Reset
            </button>
            <label className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={mockMode}
                onChange={(e) => setMockMode(e.target.checked)}
              />
              Mock
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <OfficeCanvas />
            <EventPanel />
            <ConversationsView />
            <ChatPanel />
          </div>
          <div className="space-y-4">
            <CompanyHealth />
            <AgentSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
