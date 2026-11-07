"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChevronLeft,
  FlaskConical,
  History,
  LayoutGrid,
  LineChart,
  MessageSquare,
  PanelLeft,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { EXAM_LABELS, loadSettings, subscribeSettings, type Settings as SettingsType } from "@/lib/settings";
import { loadSessions, subscribeSessions } from "@/lib/sessions";
import type { ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Home", icon: LayoutGrid, exact: true },
      { href: "/chat", label: "AI Chat", icon: MessageSquare, badge: "AI" },
      { href: "/history", label: "History", icon: History },
    ],
  },
  {
    label: "Visual tools",
    items: [
      { href: "/tools/grapher", label: "2D Grapher", icon: LineChart },
      { href: "/tools/3d", label: "3D Lab", icon: Boxes },
      { href: "/tools/scientific", label: "Graph Library", icon: FlaskConical },
      { href: "/tools/diagrams", label: "Diagrams", icon: Workflow },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    setSettings(loadSettings());
    setSessions(loadSessions());
    const unsubSettings = subscribeSettings(() => setSettings(loadSettings()));
    const unsubSessions = subscribeSessions(() => setSessions(loadSessions()));
    return () => {
      unsubSettings();
      unsubSessions();
    };
  }, []);

  const engineConnected = settings?.engine.provider !== "local" && Boolean(settings?.engine.apiKey);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[.055] bg-[#060910]/72 backdrop-blur-2xl lg:flex"
      style={{ width: collapsed ? 84 : 272 }}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[.07] to-transparent" />

      <div className={cn("flex h-[74px] items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <Link href="/" className="flex items-center gap-3">
          <Logo size={collapsed ? 32 : 36} />
          {!collapsed && (
            <span className="flex flex-col">
              <span className="font-display text-[16px] font-semibold tracking-[0.02em] text-white">
                AXIOM
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.26em] text-cyan-300/60">
                Visual AI
              </span>
            </span>
          )}
        </Link>
      </div>

      <div className={cn("px-3", collapsed && "px-2")}>
        <Link
          href="/chat?new=1"
          className={cn(
            "btn-primary w-full",
            collapsed ? "px-0" : "justify-start px-3.5"
          )}
          title="New chat"
        >
          <Plus size={15} strokeWidth={2.6} />
          {!collapsed && <span>New chat</span>}
          {!collapsed && <span className="ml-auto rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#041014]/80">N</span>}
        </Link>
      </div>

      <nav className="scrollbar-none mt-5 flex-1 overflow-y-auto px-3">
        {NAV.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <p className="mb-2 px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[12.5px] font-medium transition-all duration-200",
                      active
                        ? "bg-white/[.055] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05)]"
                        : "text-slate-400 hover:bg-white/[.03] hover:text-slate-100",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_14px_2px_rgba(var(--accent),.55)]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition",
                        active
                          ? "border-[rgba(var(--accent),.28)] bg-[rgba(var(--accent),.1)] text-[rgb(var(--accent))]"
                          : "border-white/[.05] bg-white/[.025] text-slate-500 group-hover:border-white/10 group-hover:text-slate-300"
                      )}
                    >
                      <Icon size={14} strokeWidth={2.1} />
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto rounded-full border border-cyan-300/20 bg-cyan-400/10 px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {!collapsed && sessions.length > 0 && (
          <div className="mt-1">
            <p className="mb-2 px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Recent
            </p>
            <div className="flex flex-col gap-0.5">
              {sessions.slice(0, 3).map((session) => (
                <Link
                  key={session.id}
                  href={`/chat?session=${session.id}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11.5px] text-slate-500 transition hover:bg-white/[.03] hover:text-slate-300"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-slate-600 group-hover:bg-[rgb(var(--accent))]" />
                  <span className="truncate">{session.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className={cn("border-t border-white/[.055] p-3", collapsed && "px-2")}>
        {!collapsed && (
          <div className="mb-2.5 rounded-xl border border-white/[.06] bg-gradient-to-br from-white/[.04] to-transparent p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                <Zap size={11} className="text-amber-300" />
                {EXAM_LABELS[settings?.exam ?? "jee"]} focus
              </span>
              <span className="text-[9px] text-slate-600">{settings?.targetYear ?? "2027"}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.07]">
              <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" />
            </div>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">
              {engineConnected ? "LLM engine connected" : "Local visual engine ready"}
            </p>
          </div>
        )}

        <Link
          href="/settings"
          title="Settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[12.5px] font-medium transition",
            pathname === "/settings"
              ? "bg-white/[.055] text-white"
              : "text-slate-400 hover:bg-white/[.03] hover:text-slate-100",
            collapsed && "justify-center px-0"
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[.05] bg-white/[.025] text-slate-500">
            <SettingsIcon size={14} />
          </span>
          {!collapsed && "Settings"}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[11.5px] font-medium text-slate-600 transition hover:bg-white/[.03] hover:text-slate-300",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-white/[.055] bg-[#060910]/80 px-4 backdrop-blur-2xl lg:hidden">
      <button
        type="button"
        onClick={onMenu}
        className="icon-btn h-9 w-9"
        aria-label="Open navigation menu"
      >
        <PanelLeft size={16} />
      </button>
      <Link href="/" className="flex items-center gap-2.5">
        <Logo size={28} />
        <span className="font-display text-[14.5px] font-semibold tracking-[0.04em] text-white">AXIOM</span>
      </Link>
      <Link href="/chat?new=1" className="icon-btn h-9 w-9" aria-label="New chat">
        <Plus size={16} />
      </Link>
    </header>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SettingsType | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, [open]);

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const items = NAV.flatMap((group) => group.items);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 left-0 z-[80] flex w-[286px] flex-col border-r border-white/10 bg-[#070b12]/96 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex h-[64px] items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo size={32} />
                <span className="flex flex-col">
                  <span className="font-display text-[15px] font-semibold text-white">AXIOM</span>
                  <span className="text-[8.5px] uppercase tracking-[0.24em] text-cyan-300/60">Visual AI</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[.05] text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300"
                aria-label="Close menu"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>

            <div className="px-4 pb-4">
              <Link href="/chat?new=1" onClick={onClose} className="btn-primary w-full justify-start px-3.5">
                <Sparkles size={14} /> Start a new chat
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3">
              {items.map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition",
                      active ? "bg-white/[.06] text-white" : "text-slate-400 hover:bg-white/[.03]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg border",
                        active
                          ? "border-[rgba(var(--accent),.3)] bg-[rgba(var(--accent),.12)] text-[rgb(var(--accent))]"
                          : "border-white/[.06] bg-white/[.03] text-slate-500"
                      )}
                    >
                      <Icon size={14} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium text-slate-400 transition hover:bg-white/[.03]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[.06] bg-white/[.03] text-slate-500">
                  <SettingsIcon size={14} />
                </span>
                Settings
              </Link>
            </nav>

            <div className="border-t border-white/[.06] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-[11px] font-semibold text-cyan-200">
                  {(settings?.name?.trim()?.[0] ?? "A").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-slate-200">
                    {settings?.name?.trim() || "Student"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {EXAM_LABELS[settings?.exam ?? "jee"]} · Target {settings?.targetYear ?? "2027"}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function MobileBottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Home", icon: LayoutGrid, exact: true },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/tools/3d", label: "3D Lab", icon: Boxes, accent: true },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.07] bg-[#060910]/88 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-medium transition",
                active ? "text-[rgb(var(--accent))]" : "text-slate-500"
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute -top-px h-[2px] w-8 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_12px_2px_rgba(var(--accent),.5)]"
                />
              )}
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition",
                  active && "bg-[rgba(var(--accent),.1)]"
                )}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
              </span>
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-medium text-slate-500"
          aria-label="Open more navigation"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg">
            <PanelLeft size={17} strokeWidth={1.9} />
          </span>
          More
        </button>
      </div>
    </nav>
  );
}
