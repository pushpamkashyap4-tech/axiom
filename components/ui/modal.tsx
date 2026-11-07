"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "xl",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "full";
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const width = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
    full: "max-w-[96vw]",
  }[size];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.99 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "glass-strong relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border-white/10 sm:rounded-3xl",
              width
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Dialog"}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
            <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
              <div className="min-w-0">
                {title && (
                  <h3 className="truncate font-display text-[17px] font-semibold tracking-tight text-white">{title}</h3>
                )}
                {subtitle && <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[.05] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur transition-all duration-200 hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300 active:scale-95"
              >
                <X size={15} strokeWidth={2.4} />
                <span className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_24px_-4px_rgba(251,113,133,.6)] transition-opacity group-hover:opacity-100" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6">{children}</div>
            {footer && <div className="border-t border-white/[.06] px-5 py-3.5 sm:px-6">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
