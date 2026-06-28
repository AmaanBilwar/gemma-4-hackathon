"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { OfficeScene, OFFICE_HEIGHT, OFFICE_WIDTH, type AgentView } from "@/phaser/OfficeScene";
import { useSimStore } from "@/store/simStore";
import type { Agent } from "@/lib/sim/types";

function toViews(agents: Agent[]): AgentView[] {
  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    location: a.location,
    mood: a.mood,
    speech: a.speech,
    thought: a.thought,
  }));
}

/**
 * The bridge between the simulation store and Phaser. Loaded client-only (see
 * OfficeCanvas) because Phaser touches `window` at import time.
 */
export default function PhaserGame() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentRef.current,
      width: OFFICE_WIDTH,
      height: OFFICE_HEIGHT,
      backgroundColor: "#0f172a",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [OfficeScene],
    });

    const push = () => {
      const scene = game.scene.getScene("office") as OfficeScene | null;
      scene?.setAgents(toViews(useSimStore.getState().agents));
    };

    game.events.once("ready", push);
    // Re-push whenever store state changes; the scene lerps toward new targets.
    const unsubscribe = useSimStore.subscribe(push);

    return () => {
      unsubscribe();
      game.destroy(true);
    };
  }, []);

  return <div ref={parentRef} className="h-full w-full" />;
}
