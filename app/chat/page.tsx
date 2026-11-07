import { Suspense } from "react";
import { ChatScreen } from "@/components/chat/chat-screen";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[70dvh] items-center justify-center">
          <div className="flex items-center gap-2.5 text-[12px] text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border border-slate-700 border-t-cyan-400" />
            Loading Axiom…
          </div>
        </div>
      }
    >
      <ChatScreen />
    </Suspense>
  );
}
