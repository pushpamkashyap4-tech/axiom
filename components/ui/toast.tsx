"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn, uid } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast: () => undefined };
  }
  return ctx;
}

const icons = {
  success: Check,
  error: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = uid("toast");
      setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
      const timer = setTimeout(() => dismiss(id), 3800);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        <AnimatePresence>
          {toasts.map((item) => {
            const Icon = icons[item.kind];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className="glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
                    item.kind === "error" && "border-rose-400/25 bg-rose-400/10 text-rose-300",
                    item.kind === "success" && "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
                    item.kind === "info" && "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
                  )}
                >
                  <Icon size={13} strokeWidth={2.4} />
                </span>
                <p className="flex-1 pt-0.5 text-[12.5px] font-medium leading-relaxed text-slate-200">
                  {item.message}
                </p>
                <button
                  onClick={() => dismiss(item.id)}
                  className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
