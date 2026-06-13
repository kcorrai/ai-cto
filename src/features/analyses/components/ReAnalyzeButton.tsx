"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { retriggerAnalysis } from "@/features/analyses/actions";

const ERROR_MESSAGES: Record<string, string> = {
  already_running: "An analysis is already running for this project.",
  plan_limit: "You have reached your analysis limit. Upgrade to Pro for more.",
  project_not_found: "Project not found.",
  unknown: "Something went wrong. Please try again.",
};

export function ReAnalyzeButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await retriggerAnalysis(projectId);
      if (result.ok) {
        router.push(`/projects/${projectId}/overview`);
        router.refresh();
      } else {
        setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.unknown!);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Starting…" : "Re-analyze"}
      </button>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
