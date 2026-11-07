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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-accent="cyan" suppressHydrationWarning>
      <body className="font-sans">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
