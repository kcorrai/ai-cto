import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Compare Analyses — AI CTO" };

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

function deltaColor(delta: number): string {
  if (delta > 0) return "#22c55e";
  if (delta < 0) return "#ef4444";
  return "#606060";
}

function deltaSign(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

type AnalysisRow = {
  id: string;
  score: number | null;
  createdAt: Date;
  completedAt: Date | null;
};

function PickerPage({ projectId, analyses }: { projectId: string; analyses: AnalysisRow[] }) {
  const complete = analyses.filter((a) => a.score !== null);

  if (complete.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-[#606060]">You need at least 2 completed analyses to compare.</p>
        <Link
          href={`/projects/${projectId}/history`}
          className="mt-4 text-xs text-[#3b82f6] hover:underline"
        >
          View history
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] px-6 py-12">
      <p className="mb-2 text-[11px] uppercase tracking-widest text-[#606060]">Compare Analyses</p>
      <h1 className="mb-8 text-xl font-semibold text-[#f0f0f0]">Select two analyses to compare</h1>
      <p className="mb-6 text-sm text-[#606060]">
        Pick an older (A) and a newer (B) analysis to see what changed.
      </p>
      <div className="space-y-2">
        {complete.map((a, i) => {
          const isNewest = i === 0;
          const prev = complete[i + 1];
          const date = new Date(a.completedAt ?? a.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3"
            >
              <div>
                <p className="text-sm text-[#f0f0f0]">{date}</p>
                <p className="mt-0.5 text-xs text-[#606060]">Score: {a.score}</p>
              </div>
              <div className="flex gap-2">
                {!isNewest && prev && (
                  <Link
                    href={`/projects/${projectId}/compare?a=${a.id}&b=${prev.id}`}
                    className="rounded border border-[#2a2a2a] px-2.5 py-1 text-xs text-[#606060] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
                  >
                    Compare with next →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ComparePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { id } = await props.params;
  const { a: aId, b: bId } = await props.searchParams;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true, githubOwner: true, githubRepo: true },
  });
  if (!project) notFound();

  // No params — show picker
  if (!aId || !bId) {
    const analyses = await db.analysis.findMany({
      where: { projectId: project.id, status: "complete" },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, createdAt: true, completedAt: true },
    });
    return <PickerPage projectId={project.id} analyses={analyses} />;
  }

  // Fetch both analyses in parallel
  const [analysisA, analysisB] = await Promise.all([
    db.analysis.findFirst({
      where: { id: aId, projectId: project.id },
      select: {
        id: true,
        score: true,
        createdAt: true,
        completedAt: true,
        status: true,
        modules: { select: { module: true, score: true } },
        findingRecords: {
          select: { id: true, title: true, module: true, severity: true, isResolved: true },
        },
      },
    }),
    db.analysis.findFirst({
      where: { id: bId, projectId: project.id },
      select: {
        id: true,
        score: true,
        createdAt: true,
        completedAt: true,
        status: true,
        modules: { select: { module: true, score: true } },
        findingRecords: {
          select: { id: true, title: true, module: true, severity: true, isResolved: true },
        },
      },
    }),
  ]);

  if (!analysisA || !analysisB) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-[#f0f0f0]">One or both analysis IDs are invalid.</p>
        <Link
          href={`/projects/${project.id}/compare`}
          className="mt-4 text-xs text-[#3b82f6] hover:underline"
        >
          ← Back to picker
        </Link>
      </div>
    );
  }

  if (analysisA.status !== "complete" || analysisB.status !== "complete") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-[#f0f0f0]">Both analyses must be complete to compare.</p>
        <Link
          href={`/projects/${project.id}/compare`}
          className="mt-4 text-xs text-[#3b82f6] hover:underline"
        >
          ← Back to picker
        </Link>
      </div>
    );
  }

  const scoreA = analysisA.score ?? 0;
  const scoreB = analysisB.score ?? 0;
  const scoreDelta = scoreB - scoreA;

  const dateA = new Date(analysisA.completedAt ?? analysisA.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dateB = new Date(analysisB.completedAt ?? analysisB.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Module scores comparison
  const moduleScoreA = new Map(analysisA.modules.map((m) => [m.module, m.score]));
  const moduleScoreB = new Map(analysisB.modules.map((m) => [m.module, m.score]));
  const allModules = Array.from(new Set([...moduleScoreA.keys(), ...moduleScoreB.keys()])).sort();

  // Findings comparison — match by (title, module)
  type FindingRow = {
    id: string;
    title: string;
    module: string;
    severity: string;
    isResolved: boolean;
  };
  const findingsA: FindingRow[] = analysisA.findingRecords;
  const findingsB: FindingRow[] = analysisB.findingRecords;

  const keyOf = (f: FindingRow) => `${f.module}||${f.title.toLowerCase().trim()}`;
  const mapA = new Map(findingsA.map((f) => [keyOf(f), f]));
  const mapB = new Map(findingsB.map((f) => [keyOf(f), f]));

  const newFindings = findingsB.filter((f) => !mapA.has(keyOf(f)));
  const resolvedFindings = findingsA.filter((f) => {
    if (f.isResolved) return false;
    const inB = mapB.get(keyOf(f));
    return inB ? inB.isResolved : false;
  });
  const persistingFindings = findingsA.filter((f) => {
    if (f.isResolved) return false;
    const inB = mapB.get(keyOf(f));
    return inB ? !inB.isResolved : false;
  });

  const SEVERITY_COLOR: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#3b82f6",
    info: "#71717a",
  };

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${project.id}/history`}
          className="mb-2 inline-flex items-center gap-1 text-xs text-[#606060] hover:text-[#a0a0a0]"
        >
          ← Back to history
        </Link>
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Analysis Comparison</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">
          {project.githubOwner}/{project.githubRepo}
        </h1>
      </div>

      {/* Score delta */}
      <div className="mb-6 grid grid-cols-3 gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
        <div className="text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#606060]">A — {dateA}</p>
          <span
            className="text-4xl font-semibold tabular-nums leading-none"
            style={{ color: scoreColor(scoreA) }}
          >
            {scoreA}
          </span>
          <span className="text-sm text-[#606060]">/100</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: deltaColor(scoreDelta) }}
          >
            {deltaSign(scoreDelta)}
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[#606060]">
            {scoreDelta > 0 ? "Improvement" : scoreDelta < 0 ? "Regression" : "No change"}
          </p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#606060]">B — {dateB}</p>
          <span
            className="text-4xl font-semibold tabular-nums leading-none"
            style={{ color: scoreColor(scoreB) }}
          >
            {scoreB}
          </span>
          <span className="text-sm text-[#606060]">/100</span>
        </div>
      </div>

      {/* Module scores table */}
      {allModules.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
            Module scores
          </h2>
          <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#111111]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Module
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    A
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    B
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
                {allModules.map((mod) => {
                  const a = moduleScoreA.get(mod) ?? null;
                  const b = moduleScoreB.get(mod) ?? null;
                  const delta = a !== null && b !== null ? b - a : null;
                  return (
                    <tr key={mod}>
                      <td className="px-4 py-2.5 text-xs text-[#a0a0a0]">
                        {MODULE_NAMES[mod] ?? mod}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-[#f0f0f0]">
                        {a !== null ? a : <span className="text-[#404040]">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-[#f0f0f0]">
                        {b !== null ? b : <span className="text-[#404040]">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">
                        {delta !== null ? (
                          <span style={{ color: deltaColor(delta) }}>{deltaSign(delta)}</span>
                        ) : (
                          <span className="text-[#404040]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Findings sections */}
      <div className="space-y-6">
        {/* New findings */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#606060]">
              New findings
            </h2>
            <span className="rounded-full bg-[#ef4444]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ef4444]">
              +{newFindings.length}
            </span>
          </div>
          {newFindings.length === 0 ? (
            <p className="text-sm text-[#606060]">No new findings introduced.</p>
          ) : (
            <div className="space-y-1.5">
              {newFindings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#111111] px-4 py-2.5"
                  style={{
                    borderLeftColor: SEVERITY_COLOR[f.severity] ?? "#71717a",
                    borderLeftWidth: 3,
                  }}
                >
                  <span
                    className="shrink-0 text-[10px] font-semibold uppercase"
                    style={{ color: SEVERITY_COLOR[f.severity] ?? "#71717a" }}
                  >
                    {f.severity}
                  </span>
                  <span className="min-w-0 flex-1 text-xs text-[#f0f0f0]">{f.title}</span>
                  <span className="shrink-0 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#606060]">
                    {MODULE_NAMES[f.module] ?? f.module}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved findings */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#606060]">
              Resolved findings
            </h2>
            <span className="rounded-full bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">
              -{resolvedFindings.length}
            </span>
          </div>
          {resolvedFindings.length === 0 ? (
            <p className="text-sm text-[#606060]">No findings resolved between these analyses.</p>
          ) : (
            <div className="space-y-1.5">
              {resolvedFindings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 opacity-60"
                >
                  <span className="shrink-0 text-[10px] font-semibold uppercase text-[#22c55e]">
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 text-xs text-[#a0a0a0] line-through">
                    {f.title}
                  </span>
                  <span className="shrink-0 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#606060]">
                    {MODULE_NAMES[f.module] ?? f.module}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Persisting findings */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#606060]">
              Persisting findings
            </h2>
            <span className="rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f59e0b]">
              {persistingFindings.length}
            </span>
          </div>
          {persistingFindings.length === 0 ? (
            <p className="text-sm text-[#606060]">No persisting unresolved findings.</p>
          ) : (
            <div className="space-y-1.5">
              {persistingFindings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#111111] px-4 py-2.5"
                  style={{
                    borderLeftColor: SEVERITY_COLOR[f.severity] ?? "#71717a",
                    borderLeftWidth: 3,
                  }}
                >
                  <span
                    className="shrink-0 text-[10px] font-semibold uppercase"
                    style={{ color: SEVERITY_COLOR[f.severity] ?? "#71717a" }}
                  >
                    {f.severity}
                  </span>
                  <span className="min-w-0 flex-1 text-xs text-[#f0f0f0]">{f.title}</span>
                  <span className="shrink-0 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#606060]">
                    {MODULE_NAMES[f.module] ?? f.module}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="mt-8 flex gap-3">
        <Link
          href={`/projects/${project.id}/analysis?analysisId=${aId}`}
          className="rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
        >
          View analysis A
        </Link>
        <Link
          href={`/projects/${project.id}/analysis?analysisId=${bId}`}
          className="rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
        >
          View analysis B
        </Link>
      </div>
    </div>
  );
}
