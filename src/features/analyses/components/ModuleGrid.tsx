"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleName, ModuleStatus } from "@prisma/client";

const MODULE_NAMES: Partial<Record<ModuleName, string>> = {
  architecture: "Architecture",
  code_quality: "Code Quality",
  security: "Security",
  dependencies: "Dependencies",
  product_readiness: "Product Readiness",
  performance: "Performance",
  testing: "Testing",
  documentation: "Documentation",
  api_design: "API Design",
  database: "Database",
  devops: "DevOps",
  saas_maturity: "SaaS Maturity",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function scoreTrackColor(score: number): string {
  if (score >= 80) return "#14532d";
  if (score >= 65) return "#1e3a5f";
  if (score >= 50) return "#451a03";
  if (score >= 35) return "#431407";
  return "#450a0a";
}

export type ModuleRecord = {
  module: ModuleName;
  score: number | null;
  status: ModuleStatus;
};

export type FindingRecord = {
  id: string;
  module: string;
  severity: string;
  title: string;
  description: string | null;
  recommendation: string | null;
  filePath: string | null;
  effort: string | null;
  impact: string | null;
  isResolved: boolean;
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#71717a",
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" },
  }),
};

type HistoryPoint = {
  analysisId: string;
  completedAt: string | null;
  score: number;
  rawOutput: unknown;
};

function ModuleDrillDown({
  record,
  findings,
  projectId,
  onClose,
}: {
  record: ModuleRecord;
  findings: FindingRecord[];
  projectId: string;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const name = MODULE_NAMES[record.module] ?? record.module;
  const score = record.score ?? 0;
  const color = scoreColor(score);
  const modulefindings = findings.filter((f) => f.module === record.module);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/module-history?module=${record.module}`)
      .then((r) => r.json())
      .then((d: { history: HistoryPoint[] }) => setHistory(d.history))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [projectId, record.module]);

  // Get module-specific insight from raw output of the latest history point
  const latestRaw = history[history.length - 1]?.rawOutput as Record<string, unknown> | null;
  const pattern = latestRaw?.pattern as string | undefined;
  const strengths = latestRaw?.strengths as string[] | undefined;

  // Score trend summary
  const prev = history.length >= 2 ? history[history.length - 2]?.score : null;
  const trendDelta = prev != null ? score - prev : null;

  // Regression detection with actionable context
  function getRegressionMessage(module: string, delta: number): string {
    if (delta >= 0) return "";
    const msgs: Record<string, string> = {
      testing: "Your testing score dropped — you may have added code without updating tests.",
      security: "Your security score dropped — review recent changes to auth or API routes.",
      code_quality: "Code quality regressed — check for new duplications or complex functions.",
      architecture: "Architecture score dropped — a recent change may have broken layering.",
      documentation: "Documentation regressed — new code may be missing docs.",
      performance: "Performance score dropped — a recent change may have introduced bottlenecks.",
      dependencies: "Dependencies score dropped — check for newly added vulnerable packages.",
    };
    return (
      msgs[module] ??
      `Your ${MODULE_NAMES[module as ModuleName] ?? module} score dropped — review recent changes.`
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#606060]">Module Detail</p>
            <h3 className="mt-0.5 text-lg font-semibold text-[#f0f0f0]">{name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums" style={{ color }}>
                {score}
              </p>
              <p className="text-xs text-[#606060]">/100</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-[#606060] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Score bar */}
          <div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: scoreTrackColor(score) }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
            {trendDelta !== null && (
              <div className="mt-1">
                <p
                  className={cn(
                    "text-xs",
                    trendDelta > 0
                      ? "text-green-400"
                      : trendDelta < 0
                        ? "text-red-400"
                        : "text-[#606060]"
                  )}
                >
                  {trendDelta > 0 ? `+${trendDelta}` : trendDelta} vs. previous analysis
                </p>
                {trendDelta < 0 && (
                  <p className="mt-0.5 text-xs text-[#a0a0a0]">
                    {getRegressionMessage(record.module, trendDelta)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Module-specific insight */}
          {pattern && (
            <div className="rounded-lg bg-[#111111] px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                Detected Pattern
              </p>
              <p className="mt-0.5 text-sm text-[#f0f0f0]">{pattern}</p>
            </div>
          )}

          {/* Historical scores */}
          {!loadingHistory && history.length > 1 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                Score History
              </p>
              <div className="flex items-end gap-1.5">
                {history.map((h) => {
                  const hColor = scoreColor(h.score);
                  const barH = Math.max(8, Math.round((h.score / 100) * 56));
                  const dateLabel = h.completedAt
                    ? new Date(h.completedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "";
                  return (
                    <div key={h.analysisId} className="flex flex-1 flex-col items-center gap-1">
                      <p className="text-[10px] tabular-nums text-[#606060]">{h.score}</p>
                      <div
                        className="w-full rounded-sm"
                        style={{ height: `${barH}px`, backgroundColor: hColor }}
                      />
                      <p className="text-[9px] text-[#606060]">{dateLabel}</p>
                    </div>
                  );
                })}
              </div>
              {history.length >= 2 &&
                (() => {
                  const first = history[0]?.score ?? 0;
                  const last = history[history.length - 1]?.score ?? 0;
                  const diff = last - first;
                  if (diff === 0) return null;
                  return (
                    <p className={cn("mt-1 text-xs", diff > 0 ? "text-green-400" : "text-red-400")}>
                      {diff > 0 ? "↑" : "↓"} {Math.abs(diff)} points since first analysis
                    </p>
                  );
                })()}
            </div>
          )}

          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                Strengths
              </p>
              <ul className="space-y-1">
                {strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[#a0a0a0]">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Findings */}
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
              Findings ({modulefindings.length})
            </p>
            {modulefindings.length === 0 ? (
              <p className="text-xs text-[#606060]">No findings for this module.</p>
            ) : (
              <div className="space-y-1.5">
                {modulefindings.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-[#2a2a2a] p-3"
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: SEVERITY_COLORS[f.severity] ?? "#71717a",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          color: SEVERITY_COLORS[f.severity] ?? "#71717a",
                          backgroundColor: `${SEVERITY_COLORS[f.severity] ?? "#71717a"}15`,
                        }}
                      >
                        {f.severity}
                      </span>
                      <p className="text-xs font-medium text-[#f0f0f0]">{f.title}</p>
                    </div>
                    {f.filePath && (
                      <p className="mt-1 font-mono text-[11px] text-[#606060]">{f.filePath}</p>
                    )}
                    {f.recommendation && (
                      <p className="mt-1.5 text-xs text-[#a0a0a0]">{f.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  record,
  index,
  onClick,
}: {
  record: ModuleRecord;
  index: number;
  onClick: () => void;
}) {
  const name = MODULE_NAMES[record.module] ?? record.module;
  const score = record.score ?? 0;
  const color = scoreColor(score);
  const track = scoreTrackColor(score);

  return (
    <motion.button
      onClick={onClick}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="flex w-full flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 text-left transition-colors hover:border-[#404040] hover:bg-[#141414] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#a0a0a0]">{name}</span>
        {record.status === "failed" ? (
          <span className="text-xs text-[#ef4444]">Failed</span>
        ) : (
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>
            {score}
            <span className="text-xs font-normal text-[#606060]">/100</span>
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: track }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </motion.button>
  );
}

export function ModuleGrid({
  modules,
  findings = [],
  projectId,
}: {
  modules: ModuleRecord[];
  findings?: FindingRecord[];
  projectId?: string;
}) {
  const [selected, setSelected] = useState<ModuleRecord | null>(null);

  if (modules.length === 0) return null;

  return (
    <>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Module Scores
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <ModuleCard key={m.module} record={m} index={i} onClick={() => setSelected(m)} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#606060]">Click any module for details</p>
      </section>

      {selected && projectId && (
        <ModuleDrillDown
          record={selected}
          findings={findings}
          projectId={projectId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
