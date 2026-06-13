import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { GitHubReconnectBanner } from "@/components/shared/github-reconnect-banner";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — AI CTO" };

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      name: true,
      githubAccessToken: true,
      githubTokenExpiredAt: true,
      plan: true,
      projects: {
        where: { status: { not: "deleted" } },
        orderBy: { lastAnalyzedAt: { sort: "desc", nulls: "last" } },
        take: 5,
        select: {
          id: true,
          name: true,
          githubOwner: true,
          githubRepo: true,
          latestScore: true,
          lastAnalyzedAt: true,
          analysisCount: true,
        },
      },
    },
  });
  if (!user) redirect("/sign-in");

  const firstName = user.name?.split(" ")[0] ?? "there";
  const hasGitHub = !!user.githubAccessToken;
  const projects = user.projects;

  // New user onboarding
  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#f0f0f0]">Welcome, {firstName}</h1>
        <p className="mt-2 text-sm text-[#606060]">
          Let&apos;s get your first AI CTO report in 3 steps.
        </p>

        <div className="mt-8 space-y-3">
          {/* Step 1 */}
          <div
            className={`flex items-start gap-4 rounded-xl border p-5 ${
              hasGitHub ? "border-[#14532d] bg-[#0f1f0f]" : "border-[#2a2a2a] bg-[#111111]"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                hasGitHub ? "bg-[#22c55e] text-[#0a0a0a]" : "bg-[#1a1a1a] text-[#606060]"
              }`}
            >
              {hasGitHub ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#f0f0f0]">Connect GitHub</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Authorize AI CTO to read your repositories.
              </p>
              {!hasGitHub && (
                <Link
                  href="/settings"
                  className="mt-3 inline-block rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]"
                >
                  Connect GitHub →
                </Link>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-start gap-4 rounded-xl border p-5 ${
              !hasGitHub
                ? "border-[#2a2a2a] bg-[#0a0a0a] opacity-50"
                : "border-[#2a2a2a] bg-[#111111]"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-sm font-semibold text-[#606060]">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#f0f0f0]">Create a project</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Select any GitHub repository to analyze.
              </p>
              {hasGitHub && (
                <Link
                  href="/projects/new"
                  className="mt-3 inline-block rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]"
                >
                  Create project →
                </Link>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-5 opacity-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-sm font-semibold text-[#606060]">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#f0f0f0]">Run your first analysis</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Get architecture, security, code quality, and SaaS score in minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Returning user — show project overview
  const totalAnalyses = projects.reduce((sum, p) => sum + p.analysisCount, 0);
  const scoredProjects = projects.filter((p) => p.latestScore !== null);
  const avgScore =
    scoredProjects.length > 0
      ? Math.round(
          scoredProjects.reduce((sum, p) => sum + (p.latestScore ?? 0), 0) / scoredProjects.length
        )
      : null;

  return (
    <div className="mx-auto max-w-[760px] px-6 py-8">
      {user.githubTokenExpiredAt && (
        <div className="mb-6">
          <GitHubReconnectBanner />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">Dashboard</h1>
        <p className="mt-0.5 text-xs text-[#606060]">
          {user.plan === "pro" ? "Pro plan" : "Free plan"} · {projects.length} project
          {projects.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#606060]">Projects</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#f0f0f0]">
            {projects.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#606060]">Analyses run</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#f0f0f0]">{totalAnalyses}</p>
        </div>
        {avgScore !== null && (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <p className="text-[11px] uppercase tracking-wider text-[#606060]">Avg SaaS Score</p>
            <p
              className="mt-1 text-2xl font-semibold tabular-nums"
              style={{ color: scoreColor(avgScore) }}
            >
              {avgScore}
            </p>
          </div>
        )}
      </div>

      {/* Recent projects */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#606060]">
            Recent projects
          </h2>
          <Link href="/projects" className="text-xs text-[#3b82f6] hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}/overview`}
              className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3.5 transition-colors hover:border-[#404040]"
            >
              <div>
                <p className="text-sm font-medium text-[#f0f0f0]">
                  {p.githubOwner}/{p.githubRepo}
                </p>
                <p className="mt-0.5 text-xs text-[#606060]">
                  {p.lastAnalyzedAt
                    ? `Last analyzed ${new Date(p.lastAnalyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "No analysis yet"}
                </p>
              </div>
              {p.latestScore !== null && (
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: scoreColor(p.latestScore) }}
                >
                  {p.latestScore}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
