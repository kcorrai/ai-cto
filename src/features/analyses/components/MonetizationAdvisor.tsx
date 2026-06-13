"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type MonetizationSuggestion = {
  title: string;
  category: string;
  description: string;
  revenueImpact: string;
  effortDays: number;
  priority: "critical" | "high" | "medium" | "low";
};

type MonetizationResult = {
  generatedAt: string;
  hasStripeIntegration: boolean;
  monetizationScore: number;
  currentModelAssessment: string;
  suggestions: MonetizationSuggestion[];
  revenueLeak: string[];
  premiumFeatureSuggestions: string[];
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-[#606060]",
};

const CATEGORY_COLORS: Record<string, string> = {
  paywall: "bg-red-500/10 text-red-400 border-red-500/20",
  pricing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  trial: "bg-green-500/10 text-green-400 border-green-500/20",
  "usage-billing": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "upgrade-prompt": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "feature-gating": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function SuggestionCard({ s }: { s: MonetizationSuggestion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-3 text-left transition-colors hover:border-[#3a3a3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#f0f0f0]">{s.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                CATEGORY_COLORS[s.category] ?? "bg-[#1a1a1a] text-[#606060] border-[#2a2a2a]"
              )}
            >
              {s.category}
            </span>
            <span className={cn("text-xs font-medium", PRIORITY_COLORS[s.priority])}>
              {s.priority}
            </span>
            <span className="text-xs text-[#606060]">~{s.effortDays}d</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        )}
      </div>
      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-[#1f1f1f] pt-2">
          <p className="text-xs leading-relaxed text-[#a0a0a0]">{s.description}</p>
          <p className="text-xs text-[#606060]">
            <span className="font-medium text-[#a0a0a0]">Revenue impact: </span>
            {s.revenueImpact}
          </p>
        </div>
      )}
    </button>
  );
}

interface MonetizationAdvisorProps {
  analysisId: string;
  initialResult: MonetizationResult | null;
}

export function MonetizationAdvisor({ analysisId, initialResult }: MonetizationAdvisorProps) {
  const [result, setResult] = useState<MonetizationResult | null>(initialResult);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!initialResult);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/monetization-advisor`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed");
      }
      const data = (await res.json()) as { result: MonetizationResult };
      setResult(data.result);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run monetization analysis");
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
          <p className="text-sm font-semibold text-[#f0f0f0]">Monetization Advisor</p>
          {result && (
            <p className="mt-0.5 text-xs text-[#606060]">
              Monetization score {result.monetizationScore}/100 ·{" "}
              {result.hasStripeIntegration ? "Stripe detected" : "No payment integration"}
            </p>
          )}
          {!result && (
            <p className="mt-0.5 text-xs text-[#606060]">Optional · revenue & pricing analysis</p>
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
                Analyzing…
              </>
            ) : result ? (
              "Re-analyze"
            ) : (
              "Analyze Monetization"
            )}
          </button>
          <p className="mt-2 text-xs text-[#606060]">Uses Claude Sonnet · ~10 seconds</p>
        </div>
      )}

      {result && !expanded && (
        <div className="border-t border-[#1f1f1f] px-5 pb-5 pt-4">
          <div className="mb-4 rounded-lg bg-[#0d0d0d] p-3">
            <div className="mb-2 flex items-center gap-4">
              <div>
                <p className="text-xs text-[#606060]">Monetization Score</p>
                <p className="text-2xl font-bold text-[#f0f0f0]">{result.monetizationScore}</p>
              </div>
              <div
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-medium",
                  result.hasStripeIntegration
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : "border-[#2a2a2a] text-[#606060]"
                )}
              >
                {result.hasStripeIntegration ? "Stripe detected" : "No payments"}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#a0a0a0]">
              {result.currentModelAssessment}
            </p>
          </div>

          {result.revenueLeak.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-400">
                Revenue Leakage
              </p>
              <ul className="space-y-1">
                {result.revenueLeak.map((l, i) => (
                  <li key={i} className="text-xs text-[#a0a0a0]">
                    · {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.premiumFeatureSuggestions.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#606060]">
                Premium Feature Ideas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.premiumFeatureSuggestions.map((f, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-1 text-xs text-[#a0a0a0]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#606060]">
                Improvements
              </p>
              <div className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <SuggestionCard key={i} s={s} />
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
