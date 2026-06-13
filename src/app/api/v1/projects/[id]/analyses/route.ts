import { db } from "@/lib/db";
import { withV1Auth, apiResponse, apiError, parsePagination } from "@/lib/api/auth";

export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withV1Auth(req, async (user) => {
    const { id } = await params;
    const url = new URL(req.url);
    const { cursor, limit } = parsePagination(url);

    const project = await db.project.findFirst({
      where: { id, userId: user.userId, status: { not: "deleted" } },
      select: { id: true },
    });
    if (!project) return apiError("Project not found", 404);

    const analyses = await db.analysis.findMany({
      where: { projectId: project.id },
      select: {
        id: true,
        status: true,
        score: true,
        trigger: true,
        durationMs: true,
        tokenCount: true,
        isPublic: true,
        publicToken: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = analyses.length > limit;
    const items = hasMore ? analyses.slice(0, limit) : analyses;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return apiResponse(items, { hasMore, nextCursor });
  });
}

export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withV1Auth(req, async (user) => {
    const { id } = await params;

    if (!user.scopes.includes("write")) {
      return apiError("This key does not have write scope", 403);
    }

    const project = await db.project.findFirst({
      where: { id, userId: user.userId, status: { not: "deleted" } },
      select: { id: true },
    });
    if (!project) return apiError("Project not found", 404);

    const running = await db.analysis.findFirst({
      where: {
        projectId: project.id,
        status: { in: ["queued", "fetching", "analyzing", "synthesizing"] },
      },
      select: { id: true },
    });
    if (running) return apiError("An analysis is already in progress", 409);

    const analysis = await db.analysis.create({
      data: {
        projectId: project.id,
        triggeredById: user.userId,
        trigger: "manual",
        status: "queued",
      },
      select: { id: true, status: true, createdAt: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    void fetch(`${baseUrl}/api/queues/analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId: analysis.id }),
    });

    return apiResponse(analysis, undefined, 202);
  });
}
