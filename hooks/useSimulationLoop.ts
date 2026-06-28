"use client";

import { useEffect } from "react";
import { TICK_MS, useSimStore } from "@/store/simStore";

/** Drives the simulation: while running, fire a tick every TICK_MS. */
export function useSimulationLoop() {
  const isRunning = useSimStore((s) => s.isRunning);
  const runTick = useSimStore((s) => s.runTick);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      void runTick();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, runTick]);
}
