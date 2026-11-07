"use client";

import { useEffect, useState } from "react";
import { MobileBottomNav, MobileDrawer, MobileHeader, Sidebar } from "./sidebar";
import { applySettings, loadSettings, subscribeSettings } from "@/lib/settings";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage?.getItem("axiom.sidebar.collapsed");
    if (stored === "true") setCollapsed(true);
    const settings = loadSettings();
    applySettings(settings);
    const unsubscribe = subscribeSettings(() => {
      const next = loadSettings();
      applySettings(next);
      document.documentElement.dataset.reduceMotion = next.reduceMotion ? "true" : "false";
    });
    return unsubscribe;
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage?.setItem("axiom.sidebar.collapsed", String(next));
      } catch {
        // ignore storage errors in sandboxed previews
      }
      return next;
    });
  };

  return (
    <div
      className="relative min-h-[100dvh]"
      style={{ ["--sbw" as string]: `${collapsed ? 84 : 272}px` }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-orb -left-32 -top-40 h-[420px] w-[420px] animate-float bg-cyan-500/[.07]" />
        <div className="ambient-orb -right-40 top-1/4 h-[460px] w-[460px] animate-float bg-violet-500/[.09]" style={{ animationDelay: "-4s" }} />
        <div className="ambient-orb bottom-0 left-1/3 h-[380px] w-[380px] animate-pulse-soft bg-emerald-500/[.05]" />
        <div className="absolute inset-0 opacity-[.5] hero-grid" />
      </div>

      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <MobileHeader onMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="relative z-10 pb-[74px] transition-[padding] duration-300 ease-out lg:pb-0 lg:pl-[var(--sbw)]">
        {children}
      </div>

      <MobileBottomNav onMore={() => setDrawerOpen(true)} />
    </div>
  );
}
