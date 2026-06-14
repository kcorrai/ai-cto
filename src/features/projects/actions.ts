"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { triggerAnalysis } from "@/lib/queue/analysis";
import { checkProjectLimit, checkPrivateRepoAccess, PlanLimitError } from "@/lib/billing/limits";
import { cacheInvalidate, cacheKeys } from "@/lib/cache";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export type CreateProjectInput = {
  name: string;
  githubRepoId: number;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubUrl: string;
  isPrivate: boolean;
  language: string | null;
};

export type CreateProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; error: "unauthorized" | "plan_limit" | "duplicate_repo" | "unknown" };

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthorized" };

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "unauthorized" };

  // Enforce plan project limit (server-side)
  try {
    await checkProjectLimit(user.id);
  } catch (e) {
    if (e instanceof PlanLimitError) return { ok: false, error: "plan_limit" };
    throw e;
  }

  // Block private repos on free plan
  if (input.isPrivate) {
    try {
      await checkPrivateRepoAccess(user.id);
    } catch (e) {
      if (e instanceof PlanLimitError) return { ok: false, error: "plan_limit" };
      throw e;
    }
  }

  // Prevent duplicate repo connection
  const existing = await db.project.findFirst({
    where: {
      userId: user.id,
      githubRepoId: BigInt(input.githubRepoId),
      status: { not: "deleted" },
    },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "duplicate_repo" };

  // Ensure unique slug within user's projects
  const baseSlug = slugify(input.name) || "project";
  let slug = baseSlug;
  let suffix = 1;
  while (await db.project.findFirst({ where: { userId: user.id, slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  let projectId: string;
  try {
    const project = await db.project.create({
      data: {
        userId: user.id,
        name: input.name,
        slug,
        type: "github",
        githubRepoId: BigInt(input.githubRepoId),
        githubOwner: input.githubOwner,
        githubRepo: input.githubRepo,
        githubBranch: input.githubBranch,
        githubUrl: input.githubUrl,
        isPrivate: input.isPrivate,
        language: input.language,
      },
      select: { id: true },
    });
    projectId = project.id;
  } catch {
    return { ok: false, error: "unknown" };
  }

  // Invalidate project list cache
  await cacheInvalidate(cacheKeys.userProjects(user.id));

  // Trigger analysis non-fatally — queue may not be available in local dev
  try {
    await triggerAnalysis(projectId, user.id);
  } catch {
    // Analysis can be triggered from the overview page
  }

  redirect(`/projects/${projectId}/overview`);
}
