"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type DebtItem = {
  title: string;
  category: "architecture" | "code" | "test" | "documentation" | "dependency";
  description: string;
  remediation: string;
  effortDaysMin: number;
  effortDaysMax: number;
  businessImpact: string;
  velocityTaxPct: number;
  priority: "critical" | "high" | "medium" | "low";
};

type TechDebtResult = {
  generatedAt: string;
  totalEstimateDaysMin: number;
  totalEstimateDaysMax: number;
  aggregateVelocityTax: number;
  headline: string;
  items: DebtItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  architecture: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  code: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  test: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  documentation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  dependency: "bg-red-500/10 text-red-400 border-red-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-[#606060]",
};

function DebtCard({ item }: { item: DebtItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-3 text-left transition-colors hover:border-[#3a3a3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className={cn("text-xs font-semibold uppercase", PRIORITY_COLORS[item.priority])}>
              {item.priority}
            </p>
            <p className="text-sm font-medium text-[#f0f0f0]">{item.title}</p>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                CATEGORY_COLORS[item.category]
              )}
            >
              {item.category}
            </span>
            <span className="text-xs text-[#606060]">
              {item.effortDaysMin}–{item.effortDaysMax}d to remediate
            </span>
            {item.velocityTaxPct > 0 && (
              <>
                <span className="text-xs text-[#606060]">·</span>
                <span className="text-xs text-orange-400">
                  ~{item.velocityTaxPct}% velocity tax
                </span>
              </>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        ) : (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060]" />
        )}
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-[#1f1f1f] pt-3">
          <p className="text-xs leading-relaxed text-[#a0a0a0]">{item.description}</p>
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
              Business Impact
            </p>
            <p className="text-xs text-[#a0a0a0]">{item.businessImpact}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
              Remediation
            </p>
            <p className="text-xs text-[#a0a0a0]">{item.remediation}</p>
          </div>
        </div>
      )}
    </button>
  );
}

interface TechnicalDebtProps {
  analysisId: string;
  initialResult: TechDebtResult | null;
}

export function TechnicalDebt({ analysisId, initialResult }: TechnicalDebtProps) {
  const [result, setResult] = useState<TechDebtResult | null>(initialResult);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!initialResult);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/technical-debt`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to scan technical debt");
      }
      const data = (await res.json()) as { result: TechDebtResult };
      setResult(data.result);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan technical debt");
    } finally {
      setGenerating(false);
    }
  }

  const byPriority = ["critical", "high", "medium", "low"] as const;
  const grouped =
    result?.items.reduce(
      (acc, item) => {
        if (!acc[item.priority]) acc[item.priority] = [];
        acc[item.priority]!.push(item);
        return acc;
      },
      {} as Record<string, DebtItem[]>
    ) ?? {};

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3b82f6]"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-[#f0f0f0]">Technical Debt Inventory</p>
          {result && (
            <p className="mt-0.5 text-xs text-[#606060]">
              ~{result.totalEstimateDaysMin}–{result.totalEstimateDaysMax}d total · ~
              {result.aggregateVelocityTax}% velocity tax
            </p>
          )}
          {!result && (
            <p className="mt-0.5 text-xs text-[#606060]">Optional · AI-powered debt scanner</p>
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
                Scanning…
              </>
            ) : result ? (
              "Re-scan"
            ) : (
              "Scan Technical Debt"
            )}
          </button>
          <p className="mt-2 text-xs text-[#606060]">Uses Claude Opus · ~15 seconds</p>
        </div>
      )}

      {result && !expanded && (
        <div className="border-t border-[#1f1f1f] px-5 pb-5 pt-4">
          {/* Headline stat */}
          <div className="mb-4 rounded-lg bg-[#0d0d0d] px-4 py-3">
            <p className="text-sm font-medium text-[#f0f0f0]">{result.headline}</p>
            <div className="mt-2 flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-[#606060]">Total effort</p>
                <p className="text-base font-semibold text-[#f0f0f0]">
                  {result.totalEstimateDaysMin}–{result.totalEstimateDaysMax}d
                </p>
              </div>
              <div>
                <p className="text-xs text-[#606060]">Velocity tax</p>
                <p className="text-base font-semibold text-orange-400">
                  ~{result.aggregateVelocityTax}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[#606060]">Items</p>
                <p className="text-base font-semibold text-[#f0f0f0]">{result.items.length}</p>
              </div>
            </div>
          </div>

          {/* Items by priority */}
          {byPriority.map((priority) => {
            const items = grouped[priority];
            if (!items?.length) return null;
            return (
              <div key={priority} className="mb-4">
                <p
                  className={cn(
                    "mb-2 text-xs font-medium uppercase tracking-wide",
                    PRIORITY_COLORS[priority]
                  )}
                >
                  {priority} ({items.length})
                </p>
                <div className="space-y-1.5">
                  {items.map((item, i) => (
                    <DebtCard key={i} item={item} />
                  ))}
                </div>
              </div>
            );
          })}

          <p className="mt-2 text-[11px] text-[#606060]">
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
