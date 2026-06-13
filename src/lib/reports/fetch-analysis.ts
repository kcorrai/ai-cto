import { db } from "@/lib/db";

export type ReportAnalysis = {
  id: string;
  projectName: string;
  score: number;
  label: string;
  summary: string | null;
  completedAt: Date | null;
  modules: Array<{ module: string; score: number; status: string }>;
  findings: Array<{
    severity: string;
    title: string;
    description: string | null;
    recommendation: string | null;
    filePath: string | null;
    module: string;
    effort: string | null;
    impact: string | null;
  }>;
};

export async function fetchReportData(
  analysisId: string,
  userId: string
): Promise<ReportAnalysis | null> {
  const analysis = await db.analysis.findFirst({
    where: { id: analysisId, status: "complete" },
    select: {
      id: true,
      score: true,
      scoreBreakdown: true,
      summary: true,
      completedAt: true,
      project: {
        select: {
          userId: true,
          githubOwner: true,
          githubRepo: true,
        },
      },
      modules: {
        select: { module: true, score: true, status: true },
        orderBy: { module: "asc" },
      },
      findingRecords: {
        select: {
          severity: true,
          title: true,
          description: true,
          recommendation: true,
          filePath: true,
          module: true,
          effort: true,
          impact: true,
        },
        orderBy: [{ severity: "asc" }, { module: "asc" }],
      },
    },
  });

  if (!analysis || analysis.project.userId !== userId) return null;

  const breakdown = (analysis.scoreBreakdown as Record<string, unknown>) ?? {};

  return {
    id: analysis.id,
    projectName: `${analysis.project.githubOwner}/${analysis.project.githubRepo}`,
    score: analysis.score ?? 0,
    label: (breakdown.label as string | undefined) ?? "",
    summary: analysis.summary,
    completedAt: analysis.completedAt,
    modules: analysis.modules.map((m) => ({
      module: m.module as string,
      score: m.score ?? 0,
      status: m.status as string,
    })),
    findings: analysis.findingRecords.map((f) => ({
      severity: f.severity as string,
      title: f.title,
      description: f.description,
      recommendation: f.recommendation,
      filePath: f.filePath,
      module: f.module,
      effort: f.effort as string | null,
      impact: f.impact as string | null,
    })),
  };
}
