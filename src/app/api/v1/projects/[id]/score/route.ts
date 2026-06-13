import { db } from "@/lib/db";
import { withV1Auth, apiResponse, apiError } from "@/lib/api/auth";

export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withV1Auth(req, async (user) => {
    const { id } = await params;

    const project = await db.project.findFirst({
      where: { id, userId: user.userId, status: { not: "deleted" } },
      select: { id: true, latestScore: true, lastAnalyzedAt: true },
    });

    if (!project) return apiError("Project not found", 404);

    return apiResponse({
      projectId: project.id,
      score: project.latestScore,
      lastAnalyzedAt: project.lastAnalyzedAt,
    });
  });
}
