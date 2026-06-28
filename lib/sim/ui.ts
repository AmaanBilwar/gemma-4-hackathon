import type { Mood } from "@/lib/sim/types";

/** Shared mood -> emoji/color helpers for the UI (kept out of components). */
export const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😄",
  neutral: "😐",
  focused: "🧐",
  stressed: "😣",
  worried: "😟",
  angry: "😠",
};

export const MOOD_TEXT: Record<Mood, string> = {
  happy: "text-emerald-400",
  neutral: "text-slate-400",
  focused: "text-sky-400",
  stressed: "text-amber-400",
  worried: "text-violet-400",
  angry: "text-rose-400",
};

/** Human-readable location label (an agent id, "meeting", or own desk). */
export function locationLabel(location: string, ownId: string): string {
  if (location === "meeting") return "Meeting Room";
  if (location === ownId) return "own desk";
  return `${location}'s desk`;
}
