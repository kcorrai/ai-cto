"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { retriggerAnalysis } from "@/features/analyses/actions";

type ModuleRecord = { module: string; status: string };

type ProgressData = {
  status: string;
  progress: number;
  modules: ModuleRecord[];
};

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued — waiting to start...",
  fetching: "Fetching repository...",
  analyzing: "Analyzing code...",
  synthesizing: "Generating report...",
  complete: "Analysis complete",
  failed: "Analysis failed",
};

const MODULE_NAMES: Record<string, string> = {
  architecture: "Architecture",
  code_quality: "Code Quality",
  security: "Security",
  dependencies: "Dependencies",
  product_readiness: "Product Readiness",
};

const PHASE1_MODULES = [
  "architecture",
  "code_quality",
  "security",
  "dependencies",
  "product_readiness",
];

export function AnalysisProgress({
  analysisId,
  projectId,
}: {
  analysisId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProgressData>({
    status: "queued",
    progress: 0,
    modules: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const esRef = useRef<EventSource | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function applyData(d: ProgressData) {
    setData(d);
    if (d.status === "complete") {
      router.push(`/projects/${projectId}/analysis`);
    }
  }

  function startFallbackPolling() {
    if (fallbackRef.current) return;
    fallbackRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyses/${analysisId}/snapshot`);
        if (res.ok) {
          const json = (await res.json()) as ProgressData;
          applyData(json);
          if (json.status === "complete" || json.status === "failed") {
            clearInterval(fallbackRef.current!);
            fallbackRef.current = null;
          }
        }
      } catch {
        // silent — keep trying
      }
    }, 3000);
  }

  useEffect(() => {
    if (!("EventSource" in window)) {
      startFallbackPolling();
      return;
    }

    const es = new EventSource(`/api/analyses/${analysisId}/progress`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data as string) as ProgressData;
        applyData(d);
        if (d.status === "complete" || d.status === "failed") {
          es.close();
        }
      } catch {
        // malformed event — ignore
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      startFallbackPolling();
    };

    return () => {
      es.close();
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  function handleRetry() {
    setError(null);
    startTransition(async () => {
      const result = await retriggerAnalysis(projectId);
      if (!result.ok) {
        setError(
          result.error === "already_running"
            ? "Analysis is already running."
            : "Failed to start analysis. Please try again."
        );
      } else {
        // New analysis — refresh to get the new overview
        router.refresh();
      }
    });
  }

  const moduleMap = new Map(data.modules.map((m) => [m.module, m.status]));
  const stageLabel = STAGE_LABELS[data.status] ?? data.status;
  const isFailed = data.status === "failed";

  return (
    <div className="mx-auto max-w-[480px] px-6 py-12">
      {/* Stage + progress bar */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          {!isFailed && data.status !== "complete" && (
            <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" />
          )}
          <span className="text-sm font-medium text-[#f0f0f0]">{stageLabel}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1f1f1f]">
          <div
            className="h-full rounded-full bg-[#3b82f6] transition-all duration-700 ease-out"
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <div className="mt-1.5 text-right text-xs text-[#606060]">{data.progress}%</div>
      </div>

      {/* Module checklist */}
      <div className="space-y-2.5">
        {PHASE1_MODULES.map((mod) => {
          const status = moduleMap.get(mod) ?? "pending";
          const done = status === "complete";
          const running = status === "running";
          const failed = status === "failed";
          return (
            <div key={mod} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" />
              ) : running ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#3b82f6]" />
              ) : failed ? (
                <Circle className="h-4 w-4 shrink-0 text-[#ef4444]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#2a2a2a]" />
              )}
              <span
                className={`text-sm ${
                  done
                    ? "text-[#f0f0f0]"
                    : running
                      ? "text-[#3b82f6]"
                      : failed
                        ? "text-[#ef4444]"
                        : "text-[#606060]"
                }`}
              >
                {MODULE_NAMES[mod] ?? mod}
              </span>
            </div>
          );
        })}
      </div>

      {/* Failed state */}
      {isFailed && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-[#606060]">Something went wrong during analysis.</p>
          {error && <p className="text-sm text-[#ef4444]">{error}</p>}
          <button
            onClick={handleRetry}
            disabled={isPending}
            className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50"
          >
            {isPending ? "Starting..." : "Retry analysis"}
          </button>
        </div>
      )}
    </div>
  );
}
