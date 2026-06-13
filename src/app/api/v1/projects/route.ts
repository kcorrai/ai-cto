import { db } from "@/lib/db";
import { withV1Auth, apiResponse, apiError, parsePagination } from "@/lib/api/auth";

export function GET(req: Request) {
  return withV1Auth(req, async (user) => {
    const url = new URL(req.url);
    const { cursor, limit } = parsePagination(url);

    const projects = await db.project.findMany({
      where: { userId: user.userId, status: { not: "deleted" } },
      select: {
        id: true,
        name: true,
        slug: true,
        githubOwner: true,
        githubRepo: true,
        githubUrl: true,
        language: true,
        framework: true,
        latestScore: true,
        analysisCount: true,
        lastAnalyzedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return apiResponse(items, { hasMore, nextCursor });
  });
}

export function POST(req: Request) {
  return withV1Auth(req, async (user) => {
    if (!user.scopes.includes("write")) {
      return apiError("This key does not have write scope", 403);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON", 400);
    }

    const { githubOwner, githubRepo, githubBranch } = body as {
      githubOwner?: string;
      githubRepo?: string;
      githubBranch?: string;
    };

    if (!githubOwner || !githubRepo) {
      return apiError("githubOwner and githubRepo are required", 400);
    }

    const existing = await db.project.findFirst({
      where: { userId: user.userId, githubOwner, githubRepo, status: { not: "deleted" } },
      select: { id: true },
    });
    if (existing) return apiError("Project already exists", 409);

    const slug = `${githubOwner}-${githubRepo}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);

    const project = await db.project.create({
      data: {
        userId: user.userId,
        name: `${githubOwner}/${githubRepo}`,
        slug,
        githubOwner,
        githubRepo,
        githubBranch: githubBranch ?? "main",
        githubUrl: `https://github.com/${githubOwner}/${githubRepo}`,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        githubOwner: true,
        githubRepo: true,
        createdAt: true,
      },
    });

    return apiResponse(project, undefined, 201);
  });
}
