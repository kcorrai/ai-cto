"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type CompetitorFeature = {
  feature: string;
  description: string;
  confidence: "certain" | "likely" | "possible";
  group: "must-have" | "differentiator" | "nice-to-have";
};

type CompetitorResult = {
  generatedAt: string;
  inferredCategory: string;
  competitors: string[];
  gaps: CompetitorFeature[];
  presentFeatures: string[];
  disclaimer: string;
};

const GROUP_LABELS: Record<string, { label: string; color: string }> = {
  "must-have": { label: "Must-Have", color: "text-red-400" },
  differentiator: { label: "Differentiator", color: "text-yellow-400" },
  "nice-to-have": { label: "Nice to Have", color: "text-[#606060]" },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  certain: "bg-red-500/10 text-red-400 border-red-500/20",
  likely: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  possible: "bg-[#1a1a1a] text-[#606060] border-[#2a2a2a]",
};

function GapCard({ gap }: { gap: CompetitorFeature }) {
  const [expanded, setExpanded] = useState(false);
  const groupConfig = GROUP_LABELS[gap.group] ?? { label: gap.group, color: "text-[#a0a0a0]" };

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-3 text-left transition-colors hover:border-[#3a3a3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#f0f0f0]">{gap.feature}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className={cn("text-xs font-medium", groupConfig.color)}>
              {groupConfig.label}
            </span>
            <span className="text-xs text-[#606060]">·</span>
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                CONFIDENCE_COLORS[gap.confidence]
              )}
            >
              {gap.confidence}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        )}
      </div>
      {expanded && (
        <p className="mt-2 border-t border-[#1f1f1f] pt-2 text-xs leading-relaxed text-[#a0a0a0]">
          {gap.description}
        </p>
      )}
    </button>
  );
}

interface CompetitorAnalysisProps {
  analysisId: string;
  initialResult: CompetitorResult | null;
}

export function CompetitorAnalysis({ analysisId, initialResult }: CompetitorAnalysisProps) {
  const [result, setResult] = useState<CompetitorResult | null>(initialResult);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [expanded, setExpanded] = useState(!initialResult);

  function addCompetitor() {
    const name = inputValue.trim();
    if (!name || competitors.length >= 3) return;
    setCompetitors((prev) => [...prev, name]);
    setInputValue("");
  }

  function removeCompetitor(i: number) {
    setCompetitors((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/competitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: competitors.length ? competitors : undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to run analysis");
      }
      const data = (await res.json()) as { result: CompetitorResult };
      setResult(data.result);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run competitor analysis");
    } finally {
      setGenerating(false);
    }
  }

  const mustHave = result?.gaps.filter((g) => g.group === "must-have") ?? [];
  const differentiators = result?.gaps.filter((g) => g.group === "differentiator") ?? [];
  const niceToHave = result?.gaps.filter((g) => g.group === "nice-to-have") ?? [];

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3b82f6]"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-[#f0f0f0]">Competitor Gap Analysis</p>
          {result && (
            <p className="mt-0.5 text-xs text-[#606060]">
              {result.inferredCategory} · {result.gaps.length} gaps identified
            </p>
          )}
          {!result && (
            <p className="mt-0.5 text-xs text-[#606060]">Optional · AI-powered inference</p>
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
          {/* Competitor input */}
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-[#a0a0a0]">
              Competitors to compare against{" "}
              <span className="font-normal text-[#606060]">
                (optional — leave blank to auto-detect)
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {competitors.map((c, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-md bg-[#1a1a1a] px-2.5 py-1 text-xs text-[#a0a0a0]"
                >
                  {c}
                  <button
                    onClick={() => removeCompetitor(i)}
                    className="ml-0.5 text-[#606060] hover:text-[#f0f0f0]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {competitors.length < 3 && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                    placeholder="e.g. Notion, Linear"
                    className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-2.5 py-1 text-xs text-[#f0f0f0] placeholder-[#606060] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  />
                  <button
                    onClick={addCompetitor}
                    disabled={!inputValue.trim()}
                    className="rounded-md border border-[#2a2a2a] p-1 text-[#606060] transition-colors hover:text-[#f0f0f0] disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : result ? (
              "Re-run Analysis"
            ) : (
              "Run Competitor Analysis"
            )}
          </button>
          <p className="mt-2 text-xs text-[#606060]">Uses Claude Opus · ~15 seconds</p>
        </div>
      )}

      {/* Results */}
      {result && !expanded && (
        <div className="border-t border-[#1f1f1f] px-5 pb-5 pt-4">
          {/* Meta */}
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1">
            <p className="text-xs text-[#606060]">
              Category: <span className="text-[#a0a0a0]">{result.inferredCategory}</span>
            </p>
            {result.competitors.length > 0 && (
              <p className="text-xs text-[#606060]">
                vs. <span className="text-[#a0a0a0]">{result.competitors.join(", ")}</span>
              </p>
            )}
            <p className="text-xs text-[#606060]">
              {new Date(result.generatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Present features */}
          {result.presentFeatures.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#606060]">
                Competitive Strengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.presentFeatures.map((f, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs text-green-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gaps by group */}
          {mustHave.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-400">
                Must-Have Gaps
              </p>
              <div className="space-y-1.5">
                {mustHave.map((g, i) => (
                  <GapCard key={i} gap={g} />
                ))}
              </div>
            </div>
          )}

          {differentiators.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-yellow-400">
                Differentiator Opportunities
              </p>
              <div className="space-y-1.5">
                {differentiators.map((g, i) => (
                  <GapCard key={i} gap={g} />
                ))}
              </div>
            </div>
          )}

          {niceToHave.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#606060]">
                Nice to Have
              </p>
              <div className="space-y-1.5">
                {niceToHave.map((g, i) => (
                  <GapCard key={i} gap={g} />
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-3 border-t border-[#1f1f1f] pt-3 text-[11px] italic text-[#606060]">
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
