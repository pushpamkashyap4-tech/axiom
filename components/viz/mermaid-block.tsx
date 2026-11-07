"use client";

import { AlertTriangle, Copy, Check, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  className?: string;
  showToolbar?: boolean;
};

let initialised = false;

export function MermaidBlock({ code, className, showToolbar = true }: Props) {
  const reactId = useId();
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [copied, setCopied] = useState(false);
  const renderId = useRef(`mmd-${reactId.replace(/[:]/g, "")}-${Math.random().toString(36).slice(2, 7)}`);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!initialised) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            darkMode: true,
            fontFamily: "'Plus Jakarta Sans Variable', ui-sans-serif, system-ui",
            securityLevel: "loose",
            themeVariables: {
              darkMode: true,
              background: "transparent",
              primaryColor: "#0f1b2d",
              primaryTextColor: "#e2e8f0",
              primaryBorderColor: "#2dd4bf",
              lineColor: "#64748b",
              secondaryColor: "#171334",
              tertiaryColor: "#0b1220",
              mainBkg: "#0f1b2d",
              nodeBorder: "#334155",
              clusterBkg: "rgba(255,255,255,0.03)",
              clusterBorder: "#1e293b",
              edgeLabelBackground: "#0b1220",
              fontSize: "13px",
              textColor: "#cbd5e1",
              titleColor: "#f1f5f9",
            },
            flowchart: { curve: "basis", htmlLabels: true, padding: 14 },
            mindmap: { padding: 12 },
          } satisfies Parameters<typeof mermaid.initialize>[0]);
          initialised = true;
        }

        const { svg: rendered } = await mermaid.render(`${renderId.current}-${Date.now()}`, code.trim());
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message.split("\n").slice(0, 3).join(" ") : "Could not render diagram");
        }
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (error) {
    return (
      <div className={cn("flex flex-col gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[.05] p-4", className)}>
        <div className="flex items-center gap-2 text-[11.5px] font-semibold text-rose-300">
          <AlertTriangle size={13} /> Diagram syntax needs a fix
        </div>
        <p className="text-[11px] leading-relaxed text-rose-200/70">{error}</p>
        <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-black/40 p-2.5 text-[10px] text-slate-400">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={cn("flex min-h-[180px] items-center justify-center", className)}>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="h-3 w-3 animate-spin rounded-full border border-slate-600 border-t-cyan-400" />
          Rendering diagram…
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {showToolbar && (
        <div className="absolute right-1 top-1 z-10 flex items-center gap-1 rounded-lg border border-white/[.07] bg-black/30 p-0.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setScale((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Zoom out diagram"
          >
            <Minus size={11} />
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Reset diagram zoom"
          >
            <RotateCcw size={10} />
          </button>
          <button
            type="button"
            onClick={() => setScale((value) => Math.min(2.2, Number((value + 0.15).toFixed(2))))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Zoom in diagram"
          >
            <Plus size={11} />
          </button>
          <span className="mx-1 h-3 w-px bg-white/10" />
          <button
            type="button"
            onClick={copy}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Copy mermaid code"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={10} />}
          </button>
        </div>
      )}

      <div className="max-h-[440px] overflow-auto rounded-xl">
        <div
          className="mermaid-shell flex min-w-full items-center justify-center p-4 transition-transform duration-200"
          style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
