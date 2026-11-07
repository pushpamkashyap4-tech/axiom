import Link from "next/link";
import { Home } from "lucide-react";
import { Logo } from "@/components/app/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
      <Logo size={54} />
      <p className="mt-6 font-display text-[64px] font-semibold leading-none text-white/10">404</p>
      <h1 className="mt-2 font-display text-[22px] font-semibold text-white">This page drifted off the grid</h1>
      <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-slate-500">
        The visual you were looking for doesn&apos;t exist here. Head back to the workspace and generate something new.
      </p>
      <Link href="/" className="btn-primary mt-6 h-10 px-5 text-[12px]">
        <Home size={14} /> Back to home
      </Link>
    </div>
  );
}
