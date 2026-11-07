"use client";

import { ArrowUp, CornerDownLeft, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ChatComposer({
  onSend,
  busy,
  onStop,
  suggestions = [],
  placeholder = "Ask Axiom — concepts, graphs, 3D models, diagrams…",
}: {
  onSend: (value: string) => void;
  busy?: boolean;
  onStop?: () => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const submit = () => {
    const prompt = value.trim();
    if (!prompt || busy) return;
    onSend(prompt);
    setValue("");
  };

  return (
    <div className="w-full">
      {suggestions.length > 0 && (
        <div className="scrollbar-none mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setValue(suggestion);
                ref.current?.focus();
              }}
              className="shrink-0 rounded-full border border-white/[.07] bg-white/[.03] px-3 py-1.5 text-[10.5px] font-medium text-slate-400 transition hover:border-cyan-300/25 hover:bg-cyan-400/[.06] hover:text-cyan-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          "relative rounded-2xl transition-all duration-300",
          focused && "shadow-[0_0_0_1px_rgba(var(--accent),.22),0_24px_60px_-30px_rgba(var(--accent),.45)]"
        )}
      >
        <div className="glass-strong flex items-end gap-2 rounded-2xl p-2">
          <span className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.04]">
            <Sparkles size={14.5} className="text-[rgb(var(--accent))]" />
          </span>
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            className="min-h-[38px] flex-1 resize-none bg-transparent py-2 text-[13px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 sm:text-[13.5px]"
          />
          <button
            type="button"
            onClick={busy ? onStop : submit}
            disabled={!busy && !value.trim()}
            className={cn(
              "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              busy
                ? "border border-white/10 bg-white/[.06] text-slate-300"
                : value.trim()
                  ? "bg-gradient-to-br from-cyan-300 to-violet-300 text-[#041014] shadow-[0_6px_22px_-6px_rgba(34,211,238,.6)] hover:brightness-110"
                  : "border border-white/[.07] bg-white/[.035] text-slate-600"
            )}
            aria-label={busy ? "Stop generating" : "Send message"}
          >
            {busy ? <Square size={13} fill="currentColor" /> : <ArrowUp size={16} strokeWidth={2.4} />}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-2">
          <p className="flex items-center gap-1.5 text-[9.5px] text-slate-600">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Axiom renders visuals automatically from your words
          </p>
          <p className="hidden items-center gap-1 text-[9px] text-slate-600 sm:flex">
            <CornerDownLeft size={9} /> Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
