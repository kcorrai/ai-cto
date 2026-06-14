import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LeaderboardClient } from "@/features/leaderboard/LeaderboardClient";

export const metadata: Metadata = {
  title: "SaaS Score Leaderboard — AI CTO",
  description:
    "Discover how popular open-source SaaS projects score on architecture, security, code quality, and technical readiness. Ranked by AI CTO's comprehensive analysis.",
  openGraph: {
    title: "SaaS Score Leaderboard — AI CTO",
    description:
      "Technical rankings of popular open-source projects. Architecture, security, code quality, and SaaS readiness scores.",
    images: "/api/og",
  },
  twitter: { card: "summary_large_image" },
};

async function getLeaderboardEntries() {
  const projects = await db.project.findMany({
    where: {
      isLeaderboard: true,
      isPrivate: false,
      status: "active",
      analyses: {
        some: {
          status: "complete",
          isPublic: true,
          score: { not: null },
        },
      },
    },
    select: {
      id: true,
      name: true,
      githubOwner: true,
      githubRepo: true,
      githubUrl: true,
      language: true,
      framework: true,
      leaderboardCategory: true,
      analyses: {
        where: {
          status: "complete",
          isPublic: true,
          score: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: {
          score: true,
          publicToken: true,
          completedAt: true,
          findingRecords: {
            where: { isResolved: false },
            orderBy: { severity: "asc" },
            take: 1,
            select: { severity: true, title: true },
          },
        },
      },
    },
  });

  return projects
    .flatMap((p) => {
      const analysis = p.analyses[0];
      if (!analysis?.publicToken || analysis.score == null) return [];
      return [
        {
          id: p.id,
          name: p.name,
          githubOwner: p.githubOwner ?? "",
          githubRepo: p.githubRepo ?? "",
          githubUrl: p.githubUrl ?? null,
          language: p.language ?? null,
          framework: p.framework ?? null,
          category: p.leaderboardCategory ?? null,
          score: analysis.score,
          publicToken: analysis.publicToken,
          analyzedAt: analysis.completedAt?.toISOString() ?? null,
          topFinding: analysis.findingRecords[0]
            ? {
                severity: analysis.findingRecords[0].severity as string,
                title: analysis.findingRecords[0].title,
              }
            : null,
        },
      ];
    })
    .sort((a, b) => b.score - a.score);
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboardEntries();

  const avgScore =
    entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length)
      : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#3b82f6]">AI CTO</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#f0f0f0]">
            SaaS Score Leaderboard
          </h1>
          <p className="mt-3 max-w-xl text-base text-[#a0a0a0]">
            How do popular open-source projects score on architecture, security, code quality, and
            SaaS readiness? Ranked by AI CTO&apos;s comprehensive 12-module analysis.
          </p>

          <div className="mt-8 flex flex-wrap gap-10">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-[#f0f0f0]">{entries.length}</p>
              <p className="mt-0.5 text-xs text-[#606060]">Projects analyzed</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-semibold tabular-nums text-[#f0f0f0]">{avgScore}</p>
                <span className="text-lg text-[#606060]">/100</span>
              </div>
              <p className="mt-0.5 text-xs text-[#606060]">Average score</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tabular-nums text-[#f0f0f0]">12</p>
              <p className="mt-0.5 text-xs text-[#606060]">Analysis modules</p>
            </div>
          </div>
        </div>

        <LeaderboardClient entries={entries} />
      </div>
    </div>
  );
}
