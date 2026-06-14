import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function escapeCell(value: string | null | undefined): string {
  const s = value ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id: analysisId } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const analysis = await db.analysis.findFirst({
    where: { id: analysisId, project: { userId: user.id } },
    select: { id: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Parse filter params
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const severityParam = url.searchParams.get("severity") ?? "";
  const moduleParam = url.searchParams.get("module") ?? "";
  const statusParam = url.searchParams.get("status") ?? "all";

  const severitySet = severityParam
    ? new Set(
        severityParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    : null;

  const findings = await db.finding.findMany({
    where: { analysisId },
    select: {
      severity: true,
      module: true,
      title: true,
      description: true,
      recommendation: true,
      filePath: true,
      isResolved: true,
      createdAt: true,
    },
    orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
  });

  const filtered = findings.filter((f) => {
    if (severitySet && !severitySet.has(f.severity)) return false;
    if (moduleParam && f.module !== moduleParam) return false;
    if (statusParam === "unresolved" && f.isResolved) return false;
    if (statusParam === "resolved" && !f.isResolved) return false;
    if (q) {
      const haystack = `${f.title} ${f.description ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const header = "severity,module,title,description,recommendation,filePath,isResolved,createdAt";
  const rows = filtered.map((f) =>
    [
      escapeCell(f.severity),
      escapeCell(f.module),
      escapeCell(f.title),
      escapeCell(f.description),
      escapeCell(f.recommendation),
      escapeCell(f.filePath),
      f.isResolved ? "true" : "false",
      f.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ai-cto-findings-${date}.csv"`,
    },
  });
}
