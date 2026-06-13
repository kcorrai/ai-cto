import { auth } from "@clerk/nextjs/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { db } from "@/lib/db";
import { fetchReportData } from "@/lib/reports/fetch-analysis";
import { AnalysisReport } from "@/lib/reports/pdf-document";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (user.plan === "free") {
    return new Response("Pro plan required for PDF export", { status: 403 });
  }

  const data = await fetchReportData(analysisId, user.id);
  if (!data) return new Response("Not found", { status: 404 });

  const date = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(AnalysisReport, { data, date }) as any;
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);

  const slug = data.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const dateStr = data.completedAt
    ? new Date(data.completedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const filename = `${slug}-aicto-report-${dateStr}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
