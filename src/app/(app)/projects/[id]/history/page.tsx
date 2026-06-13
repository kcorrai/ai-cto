import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScoreTrendChart } from "@/features/analyses/components/ScoreTrendChart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "History — AI CTO" };

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

const STATUS_LABEL: Record<string, string> = {
  complete: "Complete",
  failed: "Failed",
  queued: "Queued",
  fetching: "Fetching",
  analyzing: "Analyzing",
  synthesizing: "Synthesizing",
};

const STATUS_COLOR: Record<string, string> = {
  complete: "#22c55e",
  failed: "#ef4444",
  queued: "#606060",
  fetching: "#3b82f6",
  analyzing: "#3b82f6",
  synthesizing: "#f59e0b",
};

export default async function HistoryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true, githubOwner: true, githubRepo: true },
  });
  if (!project) notFound();

  const analyses = await db.analysis.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      score: true,
      scoreBreakdown: true,
      createdAt: true,
      completedAt: true,
      _count: { select: { findingRecords: true } },
    },
  });

  const repoName = `${project.githubOwner}/${project.githubRepo}`;

  const trendData = analyses
    .filter((a) => a.status === "complete" && a.score !== null)
    .slice()
    .reverse()
    .map((a) => ({
      date: new Date(a.completedAt ?? a.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: a.score!,
      analysisId: a.id,
    }));

  return (
    <div className="mx-auto max-w-[640px] px-6 py-8">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Analysis History</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">{repoName}</h1>
        <p className="mt-0.5 text-xs text-[#606060]">
          {analyses.length} analysis run{analyses.length !== 1 ? "s" : ""}
        </p>
      </div>

      {trendData.length >= 2 && (
        <div className="mb-6">
          <ScoreTrendChart data={trendData} projectId={project.id} />
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-sm text-[#606060]">No analyses have been run yet.</p>
          <Link
            href={`/projects/${project.id}/analysis`}
            className="mt-4 inline-block rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            Run first analysis
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {analyses.map((analysis, index) => {
            const breakdown = analysis.scoreBreakdown as Record<string, unknown> | null;
            const label = (breakdown?.label as string | undefined) ?? "";
            const score = analysis.score;
            const isLatest = index === 0;
            const statusColor = STATUS_COLOR[analysis.status] ?? "#606060";
            const statusLabel = STATUS_LABEL[analysis.status] ?? analysis.status;
            const isComplete = analysis.status === "complete";

            const date = new Date(analysis.completedAt ?? analysis.createdAt).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );

            const card = (
              <div
                className={`rounded-xl border bg-[#111111] p-5 transition-colors ${
                  isComplete ? "border-[#2a2a2a] hover:border-[#404040]" : "border-[#2a2a2a]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                      {isLatest && (
                        <span className="rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] font-medium text-[#3b82f6]">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#606060]">{date}</p>
                    {isComplete && (
                      <p className="mt-1.5 text-xs text-[#606060]">
                        {analysis._count.findingRecords} finding
                        {analysis._count.findingRecords !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {isComplete && score !== null && (
                    <div className="shrink-0 text-right">
                      <span
                        className="text-3xl font-semibold tabular-nums leading-none"
                        style={{ color: scoreColor(score) }}
                      >
                        {score}
                      </span>
                      <span className="ml-0.5 text-sm text-[#606060]">/100</span>
                      {label && (
                        <p
                          className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: scoreColor(score) }}
                        >
                          {label}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );

            if (isComplete) {
              return (
                <Link
                  key={analysis.id}
                  href={`/projects/${project.id}/analysis?analysisId=${analysis.id}`}
                >
                  {card}
                </Link>
              );
            }

            return <div key={analysis.id}>{card}</div>;
          })}
        </div>
      )}
    </div>
  );
}
