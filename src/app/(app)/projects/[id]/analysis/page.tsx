import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ScoreDisplay } from "@/features/analyses/components/ScoreDisplay";
import { ModuleGrid } from "@/features/analyses/components/ModuleGrid";
import { FindingsList } from "@/features/analyses/components/FindingsList";
import { ExecutiveSummary } from "@/features/analyses/components/ExecutiveSummary";
import { ReAnalyzeButton } from "@/features/analyses/components/ReAnalyzeButton";
import { ShareButton } from "@/features/analyses/components/ShareButton";
import { TestimonialPrompt } from "@/features/analyses/components/TestimonialPrompt";
import { env } from "@/env";
import { CompetitorAnalysis } from "@/features/analyses/components/CompetitorAnalysis";
import { LaunchReadiness } from "@/features/analyses/components/LaunchReadiness";
import { TechnicalDebt } from "@/features/analyses/components/TechnicalDebt";
import { RefactorPlan } from "@/features/analyses/components/RefactorPlan";
import { GrowthAdvisor } from "@/features/analyses/components/GrowthAdvisor";
import { MonetizationAdvisor } from "@/features/analyses/components/MonetizationAdvisor";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Analysis — AI CTO" };

const RUNNING_STATUSES = new Set(["queued", "fetching", "analyzing", "synthesizing"]);
const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export default async function AnalysisPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ analysisId?: string }>;
}) {
  const { id } = await props.params;
  const { analysisId: requestedAnalysisId } = await props.searchParams;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true, name: true, githubOwner: true, githubRepo: true },
  });
  if (!project) notFound();

  const analysisWhere = requestedAnalysisId
    ? { id: requestedAnalysisId, projectId: project.id }
    : { projectId: project.id };

  const latest = await db.analysis.findFirst({
    where: analysisWhere,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      score: true,
      scoreBreakdown: true,
      summary: true,
      completedAt: true,
      modules: {
        select: { module: true, score: true, status: true },
      },
    },
  });

  // No analysis yet
  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 text-4xl text-[#2a2a2a]">📊</div>
        <h2 className="text-lg font-semibold text-[#f0f0f0]">No analysis yet</h2>
        <p className="mt-2 max-w-sm text-sm text-[#606060]">
          Run your first analysis to get an AI CTO report on your repository.
        </p>
        <Link
          href={`/projects/${project.id}/overview`}
          className="mt-6 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          Run analysis
        </Link>
      </div>
    );
  }

  // Analysis in progress → redirect to overview (TASK-021)
  if (RUNNING_STATUSES.has(latest.status)) {
    redirect(`/projects/${project.id}/overview`);
  }

  // Failed state
  if (latest.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-[#f0f0f0]">Analysis failed</h2>
        <p className="mt-2 max-w-sm text-sm text-[#606060]">
          Something went wrong while analyzing your repository. Please try again.
        </p>
        <Link
          href={`/projects/${project.id}/overview`}
          className="mt-6 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          Re-analyze
        </Link>
      </div>
    );
  }

  // Complete
  const breakdown = latest.scoreBreakdown as Record<string, unknown> | null;
  const label = (breakdown?.label as string | undefined) ?? "Pre-Alpha";
  const score = latest.score ?? 0;

  // Fetch full analysis record for metadata (competitor analysis)
  const latestFull = await db.analysis.findUnique({
    where: { id: latest.id },
    select: { metadata: true },
  });
  type CompetitorStored = {
    generatedAt: string;
    inferredCategory: string;
    competitors: string[];
    gaps: unknown[];
    presentFeatures: string[];
    disclaimer: string;
  };
  type MetaStored = {
    competitorAnalysis?: CompetitorStored;
    launchReadiness?: unknown;
    technicalDebt?: unknown;
    refactorPlan?: unknown;
    growthAdvisor?: unknown;
    monetizationAdvisor?: unknown;
  };
  const meta = latestFull?.metadata as MetaStored | null;
  const competitorResult = meta?.competitorAnalysis ?? null;
  type LaunchStored = {
    generatedAt: string;
    launchScore: number;
    verdict: "launch-ready" | "not-ready";
    verdictReason: string;
    totalBlockingDays: number;
    issues: unknown[];
    passedChecks: string[];
  };
  const launchResult = (meta?.launchReadiness as LaunchStored | undefined) ?? null;
  type TechDebtStored = {
    generatedAt: string;
    totalEstimateDaysMin: number;
    totalEstimateDaysMax: number;
    aggregateVelocityTax: number;
    headline: string;
    items: unknown[];
  };
  const techDebtResult = (meta?.technicalDebt as TechDebtStored | undefined) ?? null;
  type RefactorStored = { generatedAt: string; opportunities: unknown[] };
  const refactorResult = (meta?.refactorPlan as RefactorStored | undefined) ?? null;
  const growthResult =
    (meta?.growthAdvisor as ({ generatedAt: string } & Record<string, unknown>) | undefined) ??
    null;
  const monetizationResult =
    (meta?.monetizationAdvisor as
      | ({ generatedAt: string } & Record<string, unknown>)
      | undefined) ?? null;

  const findingRecords = await db.finding.findMany({
    where: { analysisId: latest.id },
    select: {
      id: true,
      module: true,
      severity: true,
      title: true,
      description: true,
      recommendation: true,
      filePath: true,
      effort: true,
      impact: true,
      isResolved: true,
      metadata: true,
    },
  });
  const allFindings = findingRecords
    .slice()
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5))
    .map((f) => ({
      ...f,
      severity: f.severity as string,
      effort: f.effort as string | null,
      impact: f.impact as string | null,
    }));

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          {requestedAnalysisId && (
            <Link
              href={`/projects/${project.id}/history`}
              className="mb-2 inline-flex items-center gap-1 text-xs text-[#606060] hover:text-[#a0a0a0]"
            >
              ← Back to history
            </Link>
          )}
          <p className="text-[11px] uppercase tracking-widest text-[#606060]">
            {requestedAnalysisId ? "Historical Analysis" : "Analysis Report"}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">
            {project.githubOwner}/{project.githubRepo}
          </h1>
          {latest.completedAt && (
            <p className="mt-0.5 text-xs text-[#606060]">
              Completed{" "}
              {new Date(latest.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        {!requestedAnalysisId && (
          <div className="flex items-center gap-2">
            <ShareButton
              projectName={`${project.githubOwner}/${project.githubRepo}`}
              score={score}
              findingsCount={allFindings.filter((f) => !f.isResolved).length}
              shareUrl={`${env.NEXT_PUBLIC_APP_URL}/projects/${project.id}/analysis`}
            />
            <ReAnalyzeButton projectId={project.id} />
          </div>
        )}
      </div>

      {/* Score + Executive Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#111111] px-8 py-6">
          <ScoreDisplay score={score} label={label} analysisId={latest.id} />
        </div>
        {latest.summary ? (
          <ExecutiveSummary summary={latest.summary} />
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
            <p className="text-sm text-[#606060]">Executive summary unavailable.</p>
          </div>
        )}
      </div>

      {/* Module Grid */}
      {latest.modules.length > 0 && (
        <div className="mb-6">
          <ModuleGrid modules={latest.modules} findings={allFindings} projectId={project.id} />
        </div>
      )}

      {/* Findings */}
      {allFindings.length > 0 && <FindingsList findings={allFindings} />}
      {allFindings.length === 0 && latest.modules.length > 0 && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-sm text-[#606060]">No findings — your repository looks clean.</p>
        </div>
      )}

      {/* Optional on-demand AI modules */}
      <div className="mt-6 space-y-3">
        <LaunchReadiness
          analysisId={latest.id}
          initialResult={launchResult as Parameters<typeof LaunchReadiness>[0]["initialResult"]}
        />
        <TechnicalDebt
          analysisId={latest.id}
          initialResult={techDebtResult as Parameters<typeof TechnicalDebt>[0]["initialResult"]}
        />
        <RefactorPlan
          analysisId={latest.id}
          initialResult={refactorResult as Parameters<typeof RefactorPlan>[0]["initialResult"]}
        />
        <GrowthAdvisor
          analysisId={latest.id}
          initialResult={growthResult as Parameters<typeof GrowthAdvisor>[0]["initialResult"]}
        />
        <MonetizationAdvisor
          analysisId={latest.id}
          initialResult={
            monetizationResult as Parameters<typeof MonetizationAdvisor>[0]["initialResult"]
          }
        />
        <CompetitorAnalysis
          analysisId={latest.id}
          initialResult={
            competitorResult as Parameters<typeof CompetitorAnalysis>[0]["initialResult"]
          }
        />
      </div>

      {/* Testimonial prompt — shown after completed analysis */}
      {!requestedAnalysisId && (
        <div className="mt-6">
          <TestimonialPrompt
            userName={user?.name ?? user?.email ?? ""}
            projectName={`${project.githubOwner}/${project.githubRepo}`}
          />
        </div>
      )}
    </div>
  );
}
