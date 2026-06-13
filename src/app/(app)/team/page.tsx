import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, FolderKanban, BarChart2, AlertTriangle } from "lucide-react";

export default async function TeamDashboardPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      _count: { select: { members: true, projects: true } },
      projects: {
        where: { deletedAt: null, status: "active" },
        select: { id: true, name: true, latestScore: true, lastAnalyzedAt: true },
        orderBy: { lastAnalyzedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!org) redirect("/dashboard");

  const projects = org.projects;
  const avgScore =
    projects.filter((p) => p.latestScore != null).length > 0
      ? Math.round(
          projects
            .filter((p) => p.latestScore != null)
            .reduce((sum, p) => sum + (p.latestScore ?? 0), 0) /
            projects.filter((p) => p.latestScore != null).length
        )
      : null;

  const criticalCount = await db.finding.count({
    where: {
      project: { organizationId: org.id },
      severity: "critical",
      isResolved: false,
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">{org.name}</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Team overview and project health</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Projects" value={org._count.projects.toString()} />
        <StatCard icon={Users} label="Members" value={org._count.members.toString()} />
        <StatCard
          icon={BarChart2}
          label="Avg. Score"
          value={avgScore != null ? `${avgScore}/100` : "—"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Findings"
          value={criticalCount.toString()}
          danger={criticalCount > 0}
        />
      </div>

      {/* Project list */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-[#a0a0a0]">Projects</h2>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-12 text-center">
            <FolderKanban className="mx-auto mb-3 h-8 w-8 text-[#404040]" />
            <p className="text-sm text-[#606060]">No projects yet. Create your first project.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] divide-y divide-[#1f1f1f] overflow-hidden">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#f0f0f0]">{project.name}</span>
                <div className="flex items-center gap-4">
                  {project.latestScore != null && (
                    <span
                      className={`text-sm font-medium ${
                        project.latestScore >= 70
                          ? "text-green-400"
                          : project.latestScore >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {project.latestScore}/100
                    </span>
                  )}
                  {project.lastAnalyzedAt && (
                    <span className="text-xs text-[#606060]">
                      {new Date(project.lastAnalyzedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
