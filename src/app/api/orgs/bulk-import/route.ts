import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const BulkImportSchema = z.object({
  repos: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        githubOwner: z.string().min(1).max(255),
        githubRepo: z.string().min(1).max(255),
        githubBranch: z.string().default("main"),
        githubUrl: z.string().url().optional(),
        isPrivate: z.boolean().default(false),
        language: z.string().max(50).optional(),
        description: z.string().optional(),
      })
    )
    .min(1)
    .max(100),
  scheduleAnalysis: z.boolean().default(true),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, plan: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = BulkImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const results: Array<{
    name: string;
    status: "created" | "exists" | "error";
    projectId?: string;
    error?: string;
  }> = [];

  for (const repo of parsed.data.repos) {
    const slug = `${repo.githubOwner}-${repo.githubRepo}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 60);

    try {
      // Check if already exists
      const existing = await db.project.findFirst({
        where: {
          organizationId: org.id,
          githubOwner: repo.githubOwner,
          githubRepo: repo.githubRepo,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (existing) {
        results.push({ name: repo.name, status: "exists", projectId: existing.id });
        continue;
      }

      const project = await db.project.create({
        data: {
          name: repo.name,
          slug,
          ...(repo.description ? { description: repo.description } : {}),
          type: "github",
          githubOwner: repo.githubOwner,
          githubRepo: repo.githubRepo,
          githubBranch: repo.githubBranch,
          githubUrl: repo.githubUrl ?? `https://github.com/${repo.githubOwner}/${repo.githubRepo}`,
          isPrivate: repo.isPrivate,
          ...(repo.language ? { language: repo.language } : {}),
          organizationId: org.id,
          userId: user.id,
        },
        select: { id: true },
      });

      results.push({ name: repo.name, status: "created", projectId: project.id });
    } catch (err) {
      results.push({
        name: repo.name,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const created = results.filter((r) => r.status === "created");
  const errors = results.filter((r) => r.status === "error");

  // Trigger analyses for newly created projects (staggered)
  if (parsed.data.scheduleAnalysis && created.length > 0) {
    // Fire-and-forget — don't block the response
    void (async () => {
      for (let i = 0; i < created.length; i++) {
        const item = created[i];
        if (!item?.projectId) continue;
        try {
          // Stagger: 5 seconds between each to avoid overwhelming the queue
          await new Promise((r) => setTimeout(r, i * 5000));
          const { triggerAnalysis } = await import("@/lib/queue/analysis");
          await triggerAnalysis(item.projectId, user.id, "manual");
        } catch {
          // Non-fatal
        }
      }
    })();
  }

  return NextResponse.json({
    total: parsed.data.repos.length,
    created: created.length,
    alreadyExists: results.filter((r) => r.status === "exists").length,
    errors: errors.length,
    results,
  });
}
