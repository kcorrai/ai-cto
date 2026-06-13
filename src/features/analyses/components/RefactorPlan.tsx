"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type RefactorStep = {
  step: number;
  action: string;
  verification: string;
};

type RefactorOpportunity = {
  title: string;
  currentState: string;
  desiredState: string;
  files: string[];
  steps: RefactorStep[];
  risks: string[];
  effortDays: number;
  roi: number;
  testingRequirement: string;
};

type RefactorResult = {
  generatedAt: string;
  opportunities: RefactorOpportunity[];
};

function getRoiColor(roi: number): string {
  if (roi >= 8) return "text-green-400";
  if (roi >= 5) return "text-yellow-400";
  return "text-[#606060]";
}

function OpportunityCard({ opp }: { opp: RefactorOpportunity }) {
  const [expanded, setExpanded] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  function toggleStep(stepNum: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) next.delete(stepNum);
      else next.add(stepNum);
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3b82f6]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", getRoiColor(opp.roi))}>ROI {opp.roi}/10</span>
            <p className="truncate text-sm font-semibold text-[#f0f0f0]">{opp.title}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#606060]">
            <span>~{opp.effortDays}d effort</span>
            {opp.files.length > 0 && (
              <span className="font-mono text-[#606060]">{opp.files[0]}</span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[#606060]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#1f1f1f] px-4 pb-4 pt-3 space-y-3">
          {/* Current → Desired */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-red-400">
                Now
              </p>
              <p className="text-xs leading-relaxed text-[#a0a0a0]">{opp.currentState}</p>
            </div>
            <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-green-400">
                After
              </p>
              <p className="text-xs leading-relaxed text-[#a0a0a0]">{opp.desiredState}</p>
            </div>
          </div>

          {/* Files */}
          {opp.files.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                Key Files
              </p>
              <div className="flex flex-wrap gap-1.5">
                {opp.files.map((f, i) => (
                  <span
                    key={i}
                    className="rounded bg-[#1a1a1a] px-2 py-0.5 font-mono text-[11px] text-[#a0a0a0]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
              Steps
            </p>
            <div className="space-y-1.5">
              {opp.steps.map((s) => (
                <button
                  key={s.step}
                  onClick={() => toggleStep(s.step)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-colors",
                    checkedSteps.has(s.step)
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-[#2a2a2a] bg-[#111111] hover:border-[#3a3a3a]"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                      checkedSteps.has(s.step)
                        ? "border-green-500/40 bg-green-500/20 text-green-400"
                        : "border-[#3a3a3a] text-[#606060]"
                    )}
                  >
                    {checkedSteps.has(s.step) ? "✓" : s.step}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs",
                        checkedSteps.has(s.step) ? "text-[#606060] line-through" : "text-[#f0f0f0]"
                      )}
                    >
                      {s.action}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#606060]">Verify: {s.verification}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Testing */}
          <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] p-3">
            <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
            <p className="text-xs text-[#a0a0a0]">{opp.testingRequirement}</p>
          </div>

          {/* Risks */}
          {opp.risks.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-yellow-400">
                Risks
              </p>
              <ul className="space-y-0.5">
                {opp.risks.map((r, i) => (
                  <li key={i} className="text-xs text-[#a0a0a0]">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RefactorPlanProps {
  analysisId: string;
  initialResult: RefactorResult | null;
}

export function RefactorPlan({ analysisId, initialResult }: RefactorPlanProps) {
  const [result, setResult] = useState<RefactorResult | null>(initialResult);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!initialResult);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/refactor-plan`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to generate refactor plan");
      }
      const data = (await res.json()) as { result: RefactorResult };
      setResult(data.result);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate refactor plan");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3b82f6]"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-[#f0f0f0]">Refactor Planner</p>
          {result && (
            <p className="mt-0.5 text-xs text-[#606060]">
              {result.opportunities.length} opportunities · sorted by ROI
            </p>
          )}
          {!result && (
            <p className="mt-0.5 text-xs text-[#606060]">Optional · step-by-step refactor plans</p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#606060]" />
        )}
      </button>

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
                Planning…
              </>
            ) : result ? (
              "Regenerate"
            ) : (
              "Generate Refactor Plans"
            )}
          </button>
          <p className="mt-2 text-xs text-[#606060]">Uses Claude Sonnet · ~10 seconds</p>
        </div>
      )}

      {result && !expanded && (
        <div className="border-t border-[#1f1f1f] px-5 pb-5 pt-4">
          <div className="space-y-3">
            {result.opportunities.map((opp, i) => (
              <OpportunityCard key={i} opp={opp} />
            ))}
          </div>
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
