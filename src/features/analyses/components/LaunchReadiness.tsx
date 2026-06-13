"use client";

import { useState } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LaunchIssue = {
  title: string;
  category: "security" | "stability" | "ux" | "legal";
  severity: "blocking" | "advisory";
  remediation: string;
  effortDays: number;
};

type LaunchResult = {
  generatedAt: string;
  launchScore: number;
  verdict: "launch-ready" | "not-ready";
  verdictReason: string;
  totalBlockingDays: number;
  issues: LaunchIssue[];
  passedChecks: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  security: "Security",
  stability: "Stability",
  ux: "UX",
  legal: "Legal",
};

const CATEGORY_COLORS: Record<string, string> = {
  security: "bg-red-500/10 text-red-400 border-red-500/20",
  stability: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ux: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  legal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function IssueRow({ issue }: { issue: LaunchIssue }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-colors hover:border-[#3a3a3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]",
        issue.severity === "blocking"
          ? "border-red-500/20 bg-red-500/5"
          : "border-[#2a2a2a] bg-[#0d0d0d]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {issue.severity === "blocking" ? (
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#f0f0f0]">{issue.title}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                  CATEGORY_COLORS[issue.category]
                )}
              >
                {CATEGORY_LABELS[issue.category] ?? issue.category}
              </span>
              <span className="text-xs text-[#606060]">~{issue.effortDays}d to fix</span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        )}
      </div>
      {expanded && (
        <p className="ml-5 mt-2 border-t border-[#1f1f1f] pt-2 text-xs leading-relaxed text-[#a0a0a0]">
          {issue.remediation}
        </p>
      )}
    </button>
  );
}

interface LaunchReadinessProps {
  analysisId: string;
  initialResult: LaunchResult | null;
}

export function LaunchReadiness({ analysisId, initialResult }: LaunchReadinessProps) {
  const [result, setResult] = useState<LaunchResult | null>(initialResult);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!initialResult);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/launch-readiness`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to assess launch readiness");
      }
      const data = (await res.json()) as { result: LaunchResult };
      setResult(data.result);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assess launch readiness");
    } finally {
      setGenerating(false);
    }
  }

  const blockingIssues = result?.issues.filter((i) => i.severity === "blocking") ?? [];
  const advisoryIssues = result?.issues.filter((i) => i.severity === "advisory") ?? [];

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3b82f6]"
      >
        <div className="flex items-center gap-3">
          {result && (
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                result.verdict === "launch-ready"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {result.launchScore}
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-[#f0f0f0]">Launch Readiness</p>
            {result && (
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  result.verdict === "launch-ready" ? "text-green-400" : "text-red-400"
                )}
              >
                {result.verdict === "launch-ready" ? "Launch Ready" : "Not Ready"} ·{" "}
                {blockingIssues.length} blocking, {advisoryIssues.length} advisory
              </p>
            )}
            {!result && (
              <p className="mt-0.5 text-xs text-[#606060]">Optional · AI-powered assessment</p>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#606060]" />
        )}
      </button>

      {/* Generate panel */}
      {expanded && (
        <div className="border-t border-[#1f1f1f] px-5 pb-5 pt-4">
          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assessing…
              </>
            ) : result ? (
              "Re-assess"
            ) : (
              "Assess Launch Readiness"
            )}
          </button>
          <p className="mt-2 text-xs text-[#606060]">Uses Claude Opus · ~15 seconds</p>
        </div>
      )}

      {/* Results */}
      {result && !expanded && (
        <div className="border-t border-[#1f1f1f] px-5 pb-5 pt-4">
          {/* Verdict banner */}
          <div
            className={cn(
              "mb-4 flex items-center gap-3 rounded-lg p-3",
              result.verdict === "launch-ready"
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            )}
          >
            {result.verdict === "launch-ready" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  result.verdict === "launch-ready" ? "text-green-400" : "text-red-400"
                )}
              >
                {result.verdict === "launch-ready" ? "Launch Ready" : "Not Ready to Launch"}
              </p>
              <p className="text-xs text-[#a0a0a0]">{result.verdictReason}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-bold text-[#f0f0f0]">{result.launchScore}</p>
              <p className="text-[11px] text-[#606060]">/ 100</p>
            </div>
          </div>

          {/* Passed checks */}
          {result.passedChecks.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#606060]">
                Passed Checks
              </p>
              <div className="space-y-1">
                {result.passedChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                    <span className="text-xs text-[#a0a0a0]">{check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocking issues */}
          {blockingIssues.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-red-400">
                  Blocking Issues ({blockingIssues.length})
                </p>
                <p className="text-xs text-[#606060]">~{result.totalBlockingDays}d total</p>
              </div>
              <div className="space-y-1.5">
                {blockingIssues.map((issue, i) => (
                  <IssueRow key={i} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* Advisory issues */}
          {advisoryIssues.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-yellow-400">
                Advisory Issues ({advisoryIssues.length})
              </p>
              <div className="space-y-1.5">
                {advisoryIssues.map((issue, i) => (
                  <IssueRow key={i} issue={issue} />
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-[11px] text-[#606060]">
            Generated{" "}
            {new Date(result.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
