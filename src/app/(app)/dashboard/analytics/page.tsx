import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/billing/limits";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics — AI CTO" };

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

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

export default async function AnalyticsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true, createdAt: true },
  });
  if (!user) redirect("/sign-in");

  const limits = getPlanLimits(user.plan);

  // Date ranges
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all data in parallel
  const [projectCount, analysesThisMonth, recentAnalyses, allCompletedAnalyses, allFindings] =
    await Promise.all([
      // Project count
      db.project.count({ where: { userId: user.id, status: { not: "deleted" } } }),

      // Analyses this month
      db.analysis.count({
        where: { triggeredById: user.id, createdAt: { gte: startOfMonth } },
      }),

      // Recent 10 analyses across all projects
      db.analysis.findMany({
        where: { triggeredById: user.id, status: "complete" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          score: true,
          createdAt: true,
          completedAt: true,
          project: { select: { id: true, githubOwner: true, githubRepo: true } },
        },
      }),

      // All completed analyses in last 90 days for score trend
      db.analysis.findMany({
        where: {
          triggeredById: user.id,
          status: "complete",
          score: { not: null },
          completedAt: { gte: ninetyDaysAgo },
        },
        orderBy: { completedAt: "asc" },
        select: { score: true, completedAt: true },
      }),

      // Finding module distribution
      db.finding.findMany({
        where: {
          analysis: { triggeredById: user.id, status: "complete" },
        },
        select: { module: true },
      }),
    ]);

  // Plan usage bars
  const analysisUsagePct = Math.min(
    100,
    limits.maxAnalysesPerMonth === Infinity
      ? 0
      : Math.round((analysesThisMonth / limits.maxAnalysesPerMonth) * 100)
  );
  const projectUsagePct = Math.min(
    100,
    limits.maxProjects === Infinity ? 0 : Math.round((projectCount / limits.maxProjects) * 100)
  );

  // Score trend — bucket by week ISO
  function weekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Sunday start
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const weekBuckets = new Map<string, number[]>();
  for (const a of allCompletedAnalyses) {
    if (!a.completedAt || a.score === null) continue;
    const key = weekKey(a.completedAt);
    if (!weekBuckets.has(key)) weekBuckets.set(key, []);
    weekBuckets.get(key)!.push(a.score);
  }
  const scoreTrend = Array.from(weekBuckets.entries()).map(([week, scores]) => ({
    week,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // Analysis activity — bucket by week over last 12 weeks
  const activityBuckets = new Map<string, number>();
  for (const a of allCompletedAnalyses) {
    if (!a.completedAt) continue;
    const key = weekKey(a.completedAt);
    activityBuckets.set(key, (activityBuckets.get(key) ?? 0) + 1);
  }
  const activityData = Array.from(activityBuckets.entries()).map(([week, count]) => ({
    week,
    count,
  }));

  // Finding categories
  const moduleCounts = new Map<string, number>();
  for (const f of allFindings) {
    moduleCounts.set(f.module, (moduleCounts.get(f.module) ?? 0) + 1);
  }
  const topModules = Array.from(moduleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxModuleCount = topModules[0]?.[1] ?? 1;

  const maxScore = Math.max(...scoreTrend.map((d) => d.avgScore), 0);
  const maxActivity = Math.max(...activityData.map((d) => d.count), 0);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Personal</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">Analytics</h1>
      </div>

      {/* Plan usage */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Plan usage
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-[#a0a0a0]">Analyses this month</p>
              <p className="text-xs font-medium text-[#f0f0f0]">
                {analysesThisMonth}
                {limits.maxAnalysesPerMonth !== Infinity && ` / ${limits.maxAnalysesPerMonth}`}
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1a1a]">
              <div
                className="h-full rounded-full bg-[#3b82f6] transition-all"
                style={{
                  width: `${limits.maxAnalysesPerMonth === Infinity ? 20 : analysisUsagePct}%`,
                }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-[#a0a0a0]">Projects</p>
              <p className="text-xs font-medium text-[#f0f0f0]">
                {projectCount}
                {limits.maxProjects !== Infinity && ` / ${limits.maxProjects}`}
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1a1a]">
              <div
                className="h-full rounded-full bg-[#3b82f6] transition-all"
                style={{ width: `${limits.maxProjects === Infinity ? 20 : projectUsagePct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Score trend */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Score trend — last 90 days
        </h2>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
          {scoreTrend.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#606060]">
              No completed analyses in the last 90 days.
            </p>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {scoreTrend.map(({ week, avgScore }) => (
                <div key={week} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex-1 flex items-end w-full">
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.round((avgScore / Math.max(maxScore, 100)) * 100)}%`,
                        minHeight: 4,
                        backgroundColor: scoreColor(avgScore),
                        opacity: 0.8,
                      }}
                      title={`${week}: ${avgScore}`}
                    />
                  </div>
                  <span className="hidden text-[9px] text-[#404040] group-hover:block truncate max-w-full">
                    {week}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Analysis activity */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Analysis activity — last 12 weeks
        </h2>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
          {activityData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#606060]">No analyses yet.</p>
          ) : (
            <div className="flex h-24 items-end gap-1">
              {activityData.map(({ week, count }) => (
                <div key={week} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex-1 flex items-end w-full">
                    <div
                      className="w-full rounded-t bg-[#3b82f6]"
                      style={{
                        height: `${Math.round((count / Math.max(maxActivity, 1)) * 100)}%`,
                        minHeight: 4,
                        opacity: 0.7,
                      }}
                      title={`${week}: ${count} analyses`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top finding categories */}
      <section className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Top finding categories
        </h2>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
          {topModules.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#606060]">No findings yet.</p>
          ) : (
            <div className="space-y-3">
              {topModules.map(([module, count]) => (
                <div key={module} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-[#a0a0a0]">
                    {MODULE_NAMES[module] ?? module}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                    <div
                      className="h-2 rounded-full bg-[#3b82f6]"
                      style={{
                        width: `${Math.round((count / maxModuleCount) * 100)}%`,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-[#606060]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Recent analyses
        </h2>
        {recentAnalyses.length === 0 ? (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
            <p className="text-sm text-[#606060]">
              No analyses yet. Run your first analysis to see data here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#111111]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Project
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
                {recentAnalyses.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2.5 text-xs text-[#a0a0a0]">
                      {a.project.githubOwner}/{a.project.githubRepo}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#606060]">
                      {new Date(a.completedAt ?? a.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">
                      {a.score !== null ? (
                        <span style={{ color: scoreColor(a.score) }}>{a.score}</span>
                      ) : (
                        <span className="text-[#404040]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
