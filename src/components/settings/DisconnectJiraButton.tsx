"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DisconnectJiraButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDisconnect() {
    startTransition(async () => {
      await fetch("/api/integrations/jira", { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={isPending}
      className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#ef4444]/40 hover:text-[#ef4444] disabled:opacity-50"
    >
      {isPending ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}
