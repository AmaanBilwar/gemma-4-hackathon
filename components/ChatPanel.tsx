"use client";

import { useState } from "react";
import { useSimStore } from "@/store/simStore";

export function ChatPanel() {
  const agents = useSimStore((s) => s.agents);
  const chatWithAgent = useSimStore((s) => s.chatWithAgent);

  const [target, setTarget] = useState(agents[0]?.id ?? "");
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setReply("");
    const r = await chatWithAgent(target, text.trim());
    setReply(r);
    setText("");
    setSending(false);
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Message an Employee</h2>
      <div className="flex gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200"
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask something…"
          className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
      {reply && (
        <p className="mt-2 rounded-md bg-slate-950/60 p-2 text-xs text-slate-300">{reply}</p>
      )}
    </div>
  );
}
