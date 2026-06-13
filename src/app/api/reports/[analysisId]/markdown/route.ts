import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { fetchReportData } from "@/lib/reports/fetch-analysis";
import { generateMarkdownReport } from "@/lib/reports/markdown";

export async function GET(_req: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await fetchReportData(analysisId, user.id);
  if (!data) return new Response("Not found", { status: 404 });

  const markdown = generateMarkdownReport(data);
  const slug = data.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const date = data.completedAt
    ? new Date(data.completedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const filename = `${slug}-aicto-report-${date}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
