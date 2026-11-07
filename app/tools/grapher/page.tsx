import { Suspense } from "react";
import { GrapherScreen } from "@/components/tools/grapher-screen";

export default function GrapherPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[12px] text-slate-500">Loading grapher…</div>}>
      <GrapherScreen />
    </Suspense>
  );
}
