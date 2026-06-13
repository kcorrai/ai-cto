import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, FolderKanban, BarChart2, AlertTriangle, Activity } from "lucide-react";
import { ProjectsTable } from "@/components/team/ProjectsTable";

export default async function TeamDashboardPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      _count: { select: { members: true } },
      projects: {
        where: { deletedAt: null, status: "active" },
        select: {
          id: true,
          name: true,
          latestScore: true,
          lastAnalyzedAt: true,
          analysisCount: true,
          githubOwner: true,
          githubRepo: true,
        },
        orderBy: { lastAnalyzedAt: { sort: "desc", nulls: "last" } },
      },
    },
  });

  if (!org) redirect("/dashboard");

  const projects = org.projects;
  const analyzed = projects.filter((p) => p.latestScore != null);
  const avgScore =
    analyzed.length > 0
      ? Math.round(analyzed.reduce((s, p) => s + (p.latestScore ?? 0), 0) / analyzed.length)
      : null;

  const criticalCount = await db.finding.count({
    where: {
      project: { organizationId: org.id },
      severity: "critical",
      isResolved: false,
    },
  });

  // Recent activity — last 5 analyses across org projects
  const recentAnalyses = await db.analysis.findMany({
    where: {
      project: { organizationId: org.id },
      status: "complete",
    },
    select: {
      id: true,
      score: true,
      createdAt: true,
      project: { select: { name: true, id: true } },
      triggeredBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">{org.name}</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Team overview and project health</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Projects" value={projects.length.toString()} />
        <StatCard icon={Users} label="Members" value={org._count.members.toString()} />
        <StatCard
          icon={BarChart2}
          label="Health Score"
          value={avgScore != null ? `${avgScore}/100` : "—"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Findings"
          value={criticalCount.toString()}
          danger={criticalCount > 0}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Projects table */}
        <div>
          <h2 className="mb-4 text-sm font-medium text-[#a0a0a0]">Projects</h2>
          <ProjectsTable projects={projects} />
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="mb-4 text-sm font-medium text-[#a0a0a0]">Recent Activity</h2>
          {recentAnalyses.length === 0 ? (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6 text-center">
              <Activity className="mx-auto mb-2 h-6 w-6 text-[#404040]" />
              <p className="text-xs text-[#606060]">No analyses yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] divide-y divide-[#1f1f1f] overflow-hidden">
              {recentAnalyses.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-[#f0f0f0]">{a.project.name}</p>
                  <p className="mt-0.5 text-xs text-[#606060]">
                    {a.triggeredBy.name ?? a.triggeredBy.email} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.score != null && (
                      <span
                        className={`ml-2 font-medium ${
                          a.score >= 70
                            ? "text-green-400"
                            : a.score >= 40
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {a.score}/100
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${danger ? "text-red-400" : "text-[#606060]"}`} />
        <span className="text-xs text-[#606060]">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${danger ? "text-red-400" : "text-[#f0f0f0]"}`}>
        {value}
      </p>
    </div>
  );
}
