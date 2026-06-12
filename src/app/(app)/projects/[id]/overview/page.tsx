import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { AnalysisProgress } from "@/features/analyses/components/AnalysisProgress";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview — AI CTO" };

const RUNNING_STATUSES = new Set(["queued", "fetching", "analyzing", "synthesizing"]);

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export default async function OverviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: {
      id: true,
      name: true,
      githubOwner: true,
      githubRepo: true,
      latestScore: true,
      lastAnalyzedAt: true,
      analysisCount: true,
    },
  });
  if (!project) notFound();

  const latestAnalysis = await db.analysis.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, score: true, scoreBreakdown: true, completedAt: true },
  });

  const repoName = `${project.githubOwner}/${project.githubRepo}`;

  // No analysis yet
  if (!latestAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 text-4xl text-[#2a2a2a]">📊</div>
        <h2 className="text-lg font-semibold text-[#f0f0f0]">{repoName}</h2>
        <p className="mt-2 max-w-sm text-sm text-[#606060]">
          No analysis has been run yet. Start your first AI CTO analysis.
        </p>
        <Link
          href={`/projects/${project.id}/analysis`}
          className="mt-6 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          Run analysis
        </Link>
      </div>
    );
  }

  // Analysis in progress
  if (RUNNING_STATUSES.has(latestAnalysis.status)) {
    return (
      <div className="px-6 py-8">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-widest text-[#606060]">Analyzing</p>
          <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">{repoName}</h1>
        </div>
        <AnalysisProgress analysisId={latestAnalysis.id} projectId={project.id} />
      </div>
    );
  }

  // Complete — show score summary
  const breakdown = latestAnalysis.scoreBreakdown as Record<string, unknown> | null;
  const label = (breakdown?.label as string | undefined) ?? "";
  const score = latestAnalysis.score ?? 0;
  const color = scoreColor(score);

  return (
    <div className="mx-auto max-w-[640px] px-6 py-8">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Overview</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">{repoName}</h1>
        {latestAnalysis.completedAt && (
          <p className="mt-0.5 text-xs text-[#606060]">
            Last analyzed{" "}
            {new Date(latestAnalysis.completedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Score card */}
      <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#606060]">SaaS Score</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums leading-none" style={{ color }}>
                {score}
              </span>
              <span className="text-lg text-[#606060]">/100</span>
            </div>
            {label && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color }}>
                {label}
              </p>
            )}
          </div>
          <Link
            href={`/projects/${project.id}/analysis`}
            className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            View full report
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#606060]">Analyses run</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#f0f0f0]">
            {project.analysisCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#606060]">Repository</p>
          <p className="mt-1 truncate text-sm font-medium text-[#a0a0a0]">{repoName}</p>
        </div>
      </div>
    </div>
  );
}
