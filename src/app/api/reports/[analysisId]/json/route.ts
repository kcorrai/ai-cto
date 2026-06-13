import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { fetchReportData } from "@/lib/reports/fetch-analysis";

export async function GET(_req: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await fetchReportData(analysisId, user.id);
  if (!data) return new Response("Not found", { status: 404 });

  const slug = data.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const date = data.completedAt
    ? new Date(data.completedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const filename = `${slug}-aicto-report-${date}.json`;

  const payload = {
    meta: {
      project: data.projectName,
      analysisId: data.id,
      generatedAt: new Date().toISOString(),
      tool: "AI CTO",
    },
    score: {
      value: data.score,
      label: data.label,
    },
    modules: data.modules.map((m) => ({
      name: m.module,
      score: m.score,
      status: m.status,
    })),
    findings: data.findings,
    summary: data.summary,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
