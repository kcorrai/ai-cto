import { db } from "@/lib/db";
import { withV1Auth, apiResponse, apiError } from "@/lib/api/auth";
import { cacheGet, cacheSet, cacheKeys, cacheTTL } from "@/lib/cache";

export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withV1Auth(req, async (user) => {
    const { id } = await params;
    const cacheKey = cacheKeys.analysis(id);

    const cached = await cacheGet(cacheKey);
    if (cached) return apiResponse(cached);

    const analysis = await db.analysis.findFirst({
      where: { id, project: { userId: user.userId } },
      select: {
        id: true,
        projectId: true,
        status: true,
        score: true,
        scoreBreakdown: true,
        summary: true,
        trigger: true,
        durationMs: true,
        tokenCount: true,
        isPublic: true,
        publicToken: true,
        createdAt: true,
        completedAt: true,
        modules: {
          select: { module: true, status: true, score: true, durationMs: true },
        },
      },
    });

    if (!analysis) return apiError("Analysis not found", 404);

    if (analysis.status === "complete") {
      await cacheSet(cacheKey, analysis, cacheTTL.analysis);
    }

    return apiResponse(analysis);
  });
}
