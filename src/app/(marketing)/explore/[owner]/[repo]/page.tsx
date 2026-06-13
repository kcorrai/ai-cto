import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { env } from "@/env";
import { ExecutiveSummary } from "@/features/analyses/components/ExecutiveSummary";

export const revalidate = 3600;

type Props = { params: Promise<{ owner: string; repo: string }> };

export async function generateStaticParams() {
  const projects = await db.project.findMany({
    where: {
      isPrivate: false,
      status: "active",
      githubOwner: { not: null },
      githubRepo: { not: null },
      analyses: { some: { status: "complete", isPublic: true } },
    },
    select: { githubOwner: true, githubRepo: true },
    take: 1000,
  });

  return projects
    .filter((p): p is typeof p & { githubOwner: string; githubRepo: string } =>
      Boolean(p.githubOwner && p.githubRepo)
    )
    .map((p) => ({ owner: p.githubOwner, repo: p.githubRepo }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const data = await getPageData(owner, repo);
  if (!data) return { title: "Analysis Not Found — AI CTO" };

  const name = `${owner}/${repo}`;
  const score = data.score;
  const title = `${name} — SaaS Score ${score}/100 · AI CTO`;
  const description = `AI CTO analysis of ${name}: SaaS Score ${score}/100. ${data.totalFindings} findings across architecture, security, code quality, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${env.NEXT_PUBLIC_APP_URL}/explore/${owner}/${repo}`,
    },
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_APP_URL}/explore/${owner}/${repo}`,
      images: [`${env.NEXT_PUBLIC_APP_URL}/api/og/${owner}`],
    },
    twitter: { card: "summary_large_image" },
  };
}

async function getPageData(owner: string, repo: string) {
  const project = await db.project.findFirst({
    where: {
      githubOwner: owner,
      githubRepo: repo,
      isPrivate: false,
      status: "active",
    },
    select: {
      id: true,
      githubUrl: true,
      language: true,
      framework: true,
      analyses: {
        where: { status: "complete", isPublic: true },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: {
          id: true,
          score: true,
          scoreBreakdown: true,
          summary: true,
          completedAt: true,
          publicToken: true,
          modules: {
            where: { status: "complete" },
            select: { module: true, score: true },
          },
          findingRecords: {
            where: { isResolved: false },
            orderBy: { severity: "asc" },
            take: 5,
            select: {
              id: true,
              severity: true,
              title: true,
              description: true,
              module: true,
            },
          },
        },
      },
    },
  });

  if (!project || project.analyses.length === 0) return null;
  const analysis = project.analyses[0];
  if (!analysis || analysis.score == null) return null;

  return {
    projectId: project.id,
    githubUrl: project.githubUrl,
    language: project.language,
    framework: project.framework,
    score: analysis.score,
    scoreBreakdown: analysis.scoreBreakdown as Record<string, unknown> | null,
    summary: analysis.summary,
    completedAt: analysis.completedAt,
    publicToken: analysis.publicToken,
    modules: analysis.modules,
    findings: analysis.findingRecords,
    totalFindings: analysis.findingRecords.length,
  };
}

function scoreColor(s: number) {
  if (s >= 80) return "#22c55e";
  if (s >= 65) return "#3b82f6";
  if (s >= 50) return "#f59e0b";
  if (s >= 35) return "#f97316";
  return "#ef4444";
}

function scoreLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 65) return "Good";
  if (s >= 50) return "Fair";
  if (s >= 35) return "Needs work";
  return "Critical";
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

const MODULE_LABELS: Record<string, string> = {
  architecture: "Architecture",
  code_quality: "Code Quality",
  security: "Security",
  performance: "Performance",
  testing: "Testing",
  documentation: "Documentation",
  dependencies: "Dependencies",
  api_design: "API Design",
  database: "Database",
  devops: "DevOps",
  product_readiness: "Product Readiness",
  saas_maturity: "SaaS Maturity",
};

export default async function ExplorePage({ params }: Props) {
  const { owner, repo } = await params;
  const data = await getPageData(owner, repo);

  if (!data) notFound();

  const { score, summary, findings, modules, completedAt, publicToken } = data;
  const color = scoreColor(score);
  const label = scoreLabel(score);
  const _breakdown = data.scoreBreakdown;
  const repoName = `${owner}/${repo}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link href="/leaderboard" className="text-xs text-[#606060] hover:text-[#a0a0a0]">
              Leaderboard
            </Link>
            <span className="text-xs text-[#3a3a3a]">/</span>
            {data.githubUrl ? (
              <a
                href={data.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#606060] hover:text-[#a0a0a0]"
              >
                {repoName} ↗
              </a>
            ) : (
              <span className="text-xs text-[#606060]">{repoName}</span>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f0f0f0]">{repoName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {data.language && (
              <span className="rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-xs text-[#a0a0a0]">
                {data.language}
              </span>
            )}
            {data.framework && (
              <span className="rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-xs text-[#a0a0a0]">
                {data.framework}
              </span>
            )}
            {completedAt && (
              <span className="text-xs text-[#606060]">
                Analyzed{" "}
                {new Date(completedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Score + breakdown */}
        <div className="mb-8 rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#606060]">SaaS Score</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className="text-6xl font-semibold tabular-nums leading-none"
                  style={{ color }}
                >
                  {score}
                </span>
                <span className="text-xl text-[#606060]">/100</span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color }}>
                {label}
              </p>
            </div>
            {modules.length > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
                {modules
                  .filter((m) => m.score != null)
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .slice(0, 6)
                  .map((m) => (
                    <div key={m.module}>
                      <p className="text-[10px] text-[#606060]">
                        {MODULE_LABELS[m.module] ?? m.module}
                      </p>
                      <p
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: scoreColor(m.score ?? 0) }}
                      >
                        {m.score}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Executive summary */}
        {summary && (
          <div className="mb-8">
            <ExecutiveSummary summary={summary} />
          </div>
        )}

        {/* Top findings */}
        {findings.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#606060]">
              Top Findings
            </h2>
            <div className="space-y-3">
              {findings.map((f) => (
                <div key={f.id} className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLOR[f.severity] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#f0f0f0]">{f.title}</p>
                      {f.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[#a0a0a0]">{f.description}</p>
                      )}
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-[#606060]">
                        {MODULE_LABELS[f.module] ?? f.module} ·{" "}
                        <span style={{ color: SEVERITY_COLOR[f.severity] }}>{f.severity}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {publicToken && (
              <div className="mt-4 text-center">
                <Link href={`/s/${publicToken}`} className="text-sm text-[#3b82f6] hover:underline">
                  View full report →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-base font-semibold text-[#f0f0f0]">
            Get an AI CTO report for your project
          </p>
          <p className="mt-2 text-sm text-[#a0a0a0]">
            Analyze your GitHub repository across 12 modules in minutes. Architecture, security,
            code quality, and SaaS readiness — all in one report.
          </p>
          <Link
            href="/sign-up"
            className="mt-5 inline-block rounded-md bg-[#3b82f6] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            Analyze your repo for free
          </Link>
        </div>
      </div>
    </div>
  );
}
