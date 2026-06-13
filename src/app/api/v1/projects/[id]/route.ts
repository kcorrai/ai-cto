import { db } from "@/lib/db";
import { withV1Auth, apiResponse, apiError } from "@/lib/api/auth";

export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withV1Auth(req, async (user) => {
    const { id } = await params;

    const project = await db.project.findFirst({
      where: { id, userId: user.userId, status: { not: "deleted" } },
      select: {
        id: true,
        name: true,
        slug: true,
        githubOwner: true,
        githubRepo: true,
        githubUrl: true,
        language: true,
        framework: true,
        techStack: true,
        latestScore: true,
        analysisCount: true,
        lastAnalyzedAt: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    if (!project) return apiError("Project not found", 404);

    return apiResponse(project);
  });
}
