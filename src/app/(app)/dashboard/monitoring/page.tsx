import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Monitoring — AI CTO" };

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function MonitoringDashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) redirect("/sign-in");

  const isPro = user.plan !== "free";

  const projects = await db.project.findMany({
    where: { userId: user.id, status: { not: "deleted" } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      githubOwner: true,
      githubRepo: true,
      githubBranch: true,
      monitoringEnabled: true,
      monitoringLastRun: true,
      latestScore: true,
      lastAnalyzedAt: true,
      analyses: {
        where: { status: "complete" },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { score: true, createdAt: true, trigger: true },
      },
    },
  });

  const monitored = projects.filter((p) => p.monitoringEnabled);
  const unmonitored = projects.filter((p) => !p.monitoringEnabled);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e0e0e0]">Continuous Monitoring</h1>
        <p className="mt-1 text-sm text-[#888]">
          Projects in monitoring mode are analyzed on every push to their tracked branch.
        </p>
      </div>

      {!isPro && (
        <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-4">
          <p className="text-sm text-[#f59e0b]">
            Monitoring mode requires a Pro plan.{" "}
            <Link href="/api/stripe/checkout" className="underline">
              Upgrade to Pro
            </Link>{" "}
            to enable push-triggered analysis with smart diff.
          </p>
        </div>
      )}

      {/* Monitored projects */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-[#888] uppercase tracking-wide">
          Monitored ({monitored.length})
        </h2>
        {monitored.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a2a] p-6 text-center">
            <p className="text-sm text-[#555]">No projects in monitoring mode yet.</p>
            <p className="mt-1 text-xs text-[#444]">
              Enable monitoring on a project to get push-triggered analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {monitored.map((p) => {
              const scoreDelta =
                p.analyses.length >= 2
                  ? (p.analyses[0]?.score ?? 0) - (p.analyses[1]?.score ?? 0)
                  : null;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#111111] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full bg-[#22c55e]"
                        title="Monitoring active"
                      />
                      <Link
                        href={`/projects/${p.id}/overview`}
                        className="truncate text-sm font-medium text-[#e0e0e0] hover:text-[#3b82f6]"
                      >
                        {p.githubOwner}/{p.githubRepo}
                      </Link>
                      <span className="text-xs text-[#555]">:{p.githubBranch ?? "main"}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#555]">
                      {p.monitoringLastRun ? (
                        <span>Last run: {timeAgo(p.monitoringLastRun)}</span>
                      ) : (
                        <span>No runs yet</span>
                      )}
                      {p.lastAnalyzedAt && <span>Last analysis: {timeAgo(p.lastAnalyzedAt)}</span>}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    {p.latestScore !== null && (
                      <div className="text-right">
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: scoreColor(p.latestScore) }}
                        >
                          {p.latestScore}
                        </span>
                        <span className="text-xs text-[#555]">/100</span>
                        {scoreDelta !== null && scoreDelta !== 0 && (
                          <div
                            className={`text-xs ${scoreDelta > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                          >
                            {scoreDelta > 0 ? "+" : ""}
                            {scoreDelta}
                          </div>
                        )}
                      </div>
                    )}
                    <MonitoringToggle projectId={p.id} enabled={true} isPro={isPro} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Other projects */}
      {unmonitored.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-[#888] uppercase tracking-wide">
            Not monitored ({unmonitored.length})
          </h2>
          <div className="space-y-2">
            {unmonitored.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-[#1f1f1f] px-4 py-2.5"
              >
                <Link
                  href={`/projects/${p.id}/overview`}
                  className="text-sm text-[#888] hover:text-[#e0e0e0]"
                >
                  {p.githubOwner}/{p.githubRepo}
                </Link>
                <MonitoringToggle projectId={p.id} enabled={false} isPro={isPro} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoringToggle({
  projectId,
  enabled,
  isPro,
}: {
  projectId: string;
  enabled: boolean;
  isPro: boolean;
}) {
  if (!isPro) {
    return <span className="text-xs text-[#555]">Pro required</span>;
  }

  return (
    <form
      action={async () => {
        "use server";
        const { auth } = await import("@clerk/nextjs/server");
        const { userId: clerkId } = await auth();
        if (!clerkId) return;
        const { db } = await import("@/lib/db");
        const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
        if (!user) return;
        await db.project.updateMany({
          where: { id: projectId, userId: user.id },
          data: { monitoringEnabled: !enabled },
        });
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/dashboard/monitoring");
      }}
    >
      <button
        type="submit"
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? "bg-[#22c55e]" : "bg-[#2a2a2a]"
        }`}
        title={enabled ? "Disable monitoring" : "Enable monitoring"}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </form>
  );
}
