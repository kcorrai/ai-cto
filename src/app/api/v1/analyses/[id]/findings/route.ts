import { db } from "@/lib/db";
import { withV1Auth, apiResponse, apiError, parsePagination } from "@/lib/api/auth";

export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withV1Auth(req, async (user) => {
    const { id } = await params;
    const url = new URL(req.url);
    const { cursor, limit } = parsePagination(url);
    const severity = url.searchParams.get("severity") ?? undefined;
    const resolved = url.searchParams.get("resolved");

    const analysis = await db.analysis.findFirst({
      where: { id, project: { userId: user.userId } },
      select: { id: true },
    });
    if (!analysis) return apiError("Analysis not found", 404);

    const findings = await db.finding.findMany({
      where: {
        analysisId: analysis.id,
        ...(severity ? { severity: severity as never } : {}),
        ...(resolved !== null ? { isResolved: resolved === "true" } : {}),
      },
      select: {
        id: true,
        module: true,
        severity: true,
        category: true,
        title: true,
        description: true,
        recommendation: true,
        effort: true,
        impact: true,
        filePath: true,
        lineRange: true,
        isResolved: true,
        createdAt: true,
      },
      orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = findings.length > limit;
    const items = hasMore ? findings.slice(0, limit) : findings;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return apiResponse(items, { hasMore, nextCursor });
  });
}
