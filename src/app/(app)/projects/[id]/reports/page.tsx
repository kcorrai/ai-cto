import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports — AI CTO" };

export default async function ReportsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true, githubOwner: true, githubRepo: true },
  });
  if (!project) notFound();

  const latestAnalysis = await db.analysis.findFirst({
    where: { projectId: project.id, status: "complete" },
    orderBy: { createdAt: "desc" },
    select: { id: true, score: true, completedAt: true },
  });

  const isPro = user.plan !== "free";
  const repoName = `${project.githubOwner}/${project.githubRepo}`;

  return (
    <div className="mx-auto max-w-[640px] px-6 py-8">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Reports</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">{repoName}</h1>
      </div>

      {!latestAnalysis ? (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-6 text-center">
          <p className="text-sm text-[#606060]">
            No completed analysis found. Run an analysis first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#606060]">
            Based on analysis from{" "}
            {latestAnalysis.completedAt
              ? new Date(latestAnalysis.completedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "recently"}{" "}
            · Score: {latestAnalysis.score}/100
          </p>

          {/* PDF — Pro only */}
          <div className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <div>
              <p className="text-sm font-medium text-[#f0f0f0]">PDF Report</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Full report with cover page, summary, and all findings
                {!isPro && <span className="ml-1 text-[#3b82f6]">— Pro</span>}
              </p>
            </div>
            {isPro ? (
              <a
                href={`/api/reports/${latestAnalysis.id}/pdf`}
                className="rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]"
              >
                Download PDF
              </a>
            ) : (
              <a
                href="/api/stripe/checkout"
                className="rounded-md border border-[#3b82f6] px-3 py-1.5 text-xs font-medium text-[#3b82f6] transition-colors hover:bg-[#3b82f6] hover:text-white"
              >
                Upgrade to Pro
              </a>
            )}
          </div>

          {/* Markdown */}
          <div className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <div>
              <p className="text-sm font-medium text-[#f0f0f0]">Markdown Report</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Well-formatted Markdown, renders on GitHub
              </p>
            </div>
            <a
              href={`/api/reports/${latestAnalysis.id}/markdown`}
              className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#f0f0f0] hover:text-[#f0f0f0]"
            >
              Download .md
            </a>
          </div>

          {/* JSON */}
          <div className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <div>
              <p className="text-sm font-medium text-[#f0f0f0]">JSON Export</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Full structured data for CI integration or custom tooling
              </p>
            </div>
            <a
              href={`/api/reports/${latestAnalysis.id}/json`}
              className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#f0f0f0] hover:text-[#f0f0f0]"
            >
              Download .json
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
