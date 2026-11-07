import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/space-grotesk";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AppShell } from "@/components/app/app-shell";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Axiom — Visual AI for JEE, NEET & Boards",
  description:
    "Understand anything, see everything. Axiom turns natural language into interactive graphs, 3D models, scientific plots and diagrams.",
  applicationName: "Axiom",
  keywords: ["JEE", "NEET", "boards", "AI tutor", "visual learning", "3D", "graphs"],
};

export const viewport: Viewport = {
  themeColor: "#05070c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Applies the saved theme before first paint so switching between light and
 * dark never flashes the wrong palette.
 */
const themeBootstrap = `(function(){try{var raw=localStorage.getItem("axiom.settings.v1");var s=raw?JSON.parse(raw):{};var mode=s.theme||"dark";var theme=mode==="system"?(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):mode;var el=document.documentElement;el.dataset.theme=theme;el.dataset.accent=s.accent||"cyan";el.dataset.reduceMotion=s.reduceMotion?"true":"false";el.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-accent="cyan" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="font-sans">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
