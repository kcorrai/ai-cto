import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { FindingsList } from "@/features/analyses/components/FindingsList";
import { ExecutiveSummary } from "@/features/analyses/components/ExecutiveSummary";
import type { Metadata } from "next";
import { env } from "@/env";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const analysis = await db.analysis.findFirst({
    where: { publicToken: token, isPublic: true, status: "complete" },
    select: {
      score: true,
      project: { select: { githubOwner: true, githubRepo: true } },
    },
  });

  if (!analysis) return { title: "Analysis Not Found" };

  const name = `${analysis.project.githubOwner}/${analysis.project.githubRepo}`;
  return {
    title: `${name} — SaaS Score ${analysis.score}/100 · AI CTO`,
    description: `AI CTO analysis for ${name}. SaaS Score: ${analysis.score}/100`,
    openGraph: {
      title: `${name} · SaaS Score ${analysis.score}/100`,
      description: `AI CTO technical analysis for ${name}`,
      images: [`${env.NEXT_PUBLIC_APP_URL}/api/og/${analysis.project.githubOwner}`],
    },
    twitter: { card: "summary_large_image" },
  };
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export default async function PublicSharePage({ params }: Props) {
  const { token } = await params;

  const analysis = await db.analysis.findFirst({
    where: { publicToken: token, isPublic: true, status: "complete" },
    select: {
      id: true,
      score: true,
      scoreBreakdown: true,
      summary: true,
      shareFindings: true,
      completedAt: true,
      project: {
        select: { githubOwner: true, githubRepo: true },
      },
      modules: {
        where: { status: "complete" },
        select: { module: true, score: true, status: true },
      },
      findingRecords: {
        orderBy: [{ severity: "asc" }],
        select: {
          id: true,
          severity: true,
          title: true,
          description: true,
          recommendation: true,
          filePath: true,
          module: true,
          effort: true,
          impact: true,
          isResolved: true,
        },
      },
    },
  });

  if (!analysis) notFound();

  const score = analysis.score ?? 0;
  const color = scoreColor(score);
  const breakdown = (analysis.scoreBreakdown as Record<string, unknown>) ?? {};
  const label = (breakdown.label as string | undefined) ?? "";
  const projectName = `${analysis.project.githubOwner}/${analysis.project.githubRepo}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Simple public header */}
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#3b82f6]">
            AI CTO
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            Analyze your repo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Project + score */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-widest text-[#606060]">AI CTO Report</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#f0f0f0]">{projectName}</h1>
          {analysis.completedAt && (
            <p className="mt-0.5 text-xs text-[#606060]">
              Analyzed{" "}
              {new Date(analysis.completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Score card */}
        <div className="mb-6 rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-semibold tabular-nums leading-none" style={{ color }}>
              {score}
            </span>
            <span className="text-xl text-[#606060]">/100</span>
          </div>
          {label && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color }}>
              {label}
            </p>
          )}
        </div>

        {/* Executive summary */}
        {analysis.summary && <ExecutiveSummary summary={analysis.summary} />}

        {/* Findings — if share settings allow */}
        {analysis.shareFindings && analysis.findingRecords.length > 0 && (
          <div className="mt-6">
            <FindingsList
              findings={analysis.findingRecords.map((f) => ({
                id: f.id,
                severity: f.severity as "critical" | "high" | "medium" | "low" | "info",
                title: f.title,
                description: f.description,
                recommendation: f.recommendation,
                filePath: f.filePath,
                module: f.module,
                effort: f.effort as "low" | "medium" | "high" | null,
                impact: f.impact as "low" | "medium" | "high" | null,
                isResolved: f.isResolved,
              }))}
              readonly
            />
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-sm font-medium text-[#f0f0f0]">
            Get an AI CTO report for your project
          </p>
          <p className="mt-1 text-xs text-[#606060]">
            Analyze your codebase in minutes. Architecture, security, performance, and more.
          </p>
          <Link
            href="/sign-up"
            className="mt-4 inline-block rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            Analyze your repo for free
          </Link>
        </div>
      </main>
    </div>
  );
}
