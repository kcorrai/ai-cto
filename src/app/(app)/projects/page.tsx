import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Plus, FolderKanban } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

const STATUS_LABEL: Record<string, string> = {
  complete: "Ready",
  failed: "Failed",
  queued: "Queued",
  fetching: "Fetching",
  analyzing: "Analyzing",
  synthesizing: "Synthesizing",
};

export default async function ProjectsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  const projects = await db.project.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      githubOwner: true,
      githubRepo: true,
      createdAt: true,
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, score: true },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#f0f0f0]">Projects</h2>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <FolderKanban className="h-12 w-12 text-[#2a2a2a]" />
          <p className="text-[#606060]">No projects yet.</p>
          <Link
            href="/projects/new"
            className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb]"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {projects.map((p) => {
            const latest = p.analyses[0];
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}/overview`}
                className="flex items-center justify-between rounded-lg border border-[#1f1f1f] bg-[#111111] px-5 py-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#161616]"
              >
                <div>
                  <p className="font-medium text-[#f0f0f0]">{p.name}</p>
                  <p className="mt-0.5 text-xs text-[#606060]">
                    {p.githubOwner}/{p.githubRepo}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {latest?.score != null ? (
                    <span
                      className="text-2xl font-semibold tabular-nums"
                      style={{ color: scoreColor(latest.score) }}
                    >
                      {latest.score}
                    </span>
                  ) : latest?.status && latest.status !== "complete" ? (
                    <span className="text-xs text-[#3b82f6]">
                      {STATUS_LABEL[latest.status] ?? latest.status}
                    </span>
                  ) : (
                    <span className="text-xs text-[#404040]">No analysis</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
