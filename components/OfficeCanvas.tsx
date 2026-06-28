"use client";

import dynamic from "next/dynamic";

// Phaser must load only in the browser (it touches `window` at import time).
const PhaserGame = dynamic(() => import("@/phaser/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
      Loading office…
    </div>
  ),
});

export function OfficeCanvas() {
  return (
    <div className="aspect-[840/540] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <PhaserGame />
    </div>
  );
}
