import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quality Dashboard — Admin" };

const MODULE_NAMES: Record<string, string> = {
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

export default async function AdminQualityPage() {
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [analyses, moduleRows, findings] = await Promise.all([
    db.analysis.findMany({
      where: { status: "complete", completedAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        score: true,
        completedAt: true,
        metadata: true,
        tokenCount: true,
        durationMs: true,
      },
      orderBy: { completedAt: "asc" },
    }),
    db.analysisModule.findMany({
      where: {
        status: "complete",
        score: { not: null },
        analysis: { completedAt: { gte: thirtyDaysAgo }, status: "complete" },
      },
      select: { module: true, score: true },
    }),
    db.finding.findMany({
      where: { analysis: { completedAt: { gte: thirtyDaysAgo }, status: "complete" } },
      select: { severity: true, module: true, isResolved: true },
    }),
  ]);

  // Overall stats
  const totalAnalyses = analyses.length;
  const avgScore =
    analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + (a.score ?? 0), 0) / analyses.length)
      : null;
  const totalFindings = findings.length;
  const resolvedFindings = findings.filter((f) => f.isResolved).length;
  const resolveRate =
    totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : null;

  type CostMeta = { costTracking?: { estimatedCostUsd?: string; totalDurationMs?: number } };
  const costsWithData = analyses
    .map((a) => (a.metadata as CostMeta)?.costTracking?.estimatedCostUsd)
    .filter((c): c is string => c != null)
    .map(Number);
  const avgCostUsd =
    costsWithData.length > 0
      ? (costsWithData.reduce((a, b) => a + b, 0) / costsWithData.length).toFixed(3)
      : null;
  const avgDurationMs =
    analyses.filter((a) => a.durationMs).length > 0
      ? Math.round(
          analyses.reduce((s, a) => s + (a.durationMs ?? 0), 0) /
            analyses.filter((a) => a.durationMs).length
        )
      : null;

  // Per-module averages
  const modMap: Record<string, number[]> = {};
  for (const m of moduleRows) {
    if (!modMap[m.module]) modMap[m.module] = [];
    modMap[m.module]!.push(m.score!);
  }
  const moduleAverages = Object.entries(modMap)
    .map(([mod, scores]) => ({
      module: mod,
      name: MODULE_NAMES[mod] ?? mod,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => a.avg - b.avg);

  // Finding severity breakdown
  const severityMap: Record<string, number> = {};
  for (const f of findings) {
    severityMap[f.severity] = (severityMap[f.severity] ?? 0) + 1;
  }
  const severities = ["critical", "high", "medium", "low", "info"];
  const severityColors: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#3b82f6",
    info: "#71717a",
  };

  // Score trend buckets (by week)
  type Week = { label: string; scores: number[] };
  const weekMap: Record<string, Week> = {};
  for (const a of analyses) {
    if (!a.completedAt || a.score === null) continue;
    const d = new Date(a.completedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap[key]) {
      weekMap[key] = {
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        scores: [],
      };
    }
    weekMap[key]!.scores.push(a.score);
  }
  const weeks = Object.values(weekMap).map((w) => ({
    label: w.label,
    avg: Math.round(w.scores.reduce((a, b) => a + b, 0) / w.scores.length),
    count: w.scores.length,
  }));

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <div className="mb-2 flex items-center gap-2">
        <Link href="/admin/feedback" className="text-xs text-[#3b82f6] hover:underline">
          ← Feedback
        </Link>
      </div>
      <h1 className="mb-1 text-xl font-semibold text-[#f0f0f0]">Analysis Quality Dashboard</h1>
      <p className="mb-6 text-xs text-[#606060]">Last 30 days</p>

      {/* Top stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Analyses", value: totalAnalyses },
          {
            label: "Avg Score",
            value: avgScore ?? "—",
            color: avgScore ? scoreColor(avgScore) : undefined,
          },
          { label: "Findings", value: totalFindings },
          {
            label: "Resolve rate",
            value: resolveRate !== null ? `${resolveRate}%` : "—",
            color: resolveRate ? scoreColor(resolveRate) : undefined,
          },
          { label: "Avg cost", value: avgCostUsd ? `$${avgCostUsd}` : "—" },
          {
            label: "Avg duration",
            value: avgDurationMs ? `${Math.round(avgDurationMs / 1000)}s` : "—",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <p className="text-[11px] uppercase tracking-wider text-[#606060]">{s.label}</p>
            <p
              className="mt-1 text-2xl font-semibold tabular-nums"
              style={s.color ? { color: s.color } : { color: "#f0f0f0" }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Score trend */}
      {weeks.length > 1 && (
        <div className="mb-6 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
            Weekly avg score
          </p>
          <div className="flex items-end gap-2">
            {weeks.map((w, i) => {
              const barH = Math.max(8, Math.round((w.avg / 100) * 60));
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <p className="text-[10px] tabular-nums text-[#606060]">{w.avg}</p>
                  <div
                    className="w-full rounded-sm"
                    style={{ height: `${barH}px`, backgroundColor: scoreColor(w.avg) }}
                  />
                  <p className="text-[9px] text-[#606060]">{w.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Module averages */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
            Module averages (weakest first)
          </p>
          {moduleAverages.length === 0 ? (
            <p className="text-xs text-[#606060]">No data.</p>
          ) : (
            <div className="space-y-2">
              {moduleAverages.map((m) => (
                <div key={m.module} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-xs text-[#a0a0a0]">{m.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.avg}%`, backgroundColor: scoreColor(m.avg) }}
                    />
                  </div>
                  <span
                    className="w-8 shrink-0 text-right text-xs tabular-nums"
                    style={{ color: scoreColor(m.avg) }}
                  >
                    {m.avg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Severity distribution */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
            Finding severity distribution
          </p>
          {totalFindings === 0 ? (
            <p className="text-xs text-[#606060]">No findings in range.</p>
          ) : (
            <div className="space-y-2">
              {severities.map((sev) => {
                const count = severityMap[sev] ?? 0;
                const pct = Math.round((count / totalFindings) * 100);
                return (
                  <div key={sev} className="flex items-center gap-2">
                    <span
                      className="w-14 shrink-0 text-xs capitalize"
                      style={{ color: severityColors[sev] }}
                    >
                      {sev}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: severityColors[sev] }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs tabular-nums text-[#606060]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
