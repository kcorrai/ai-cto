"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Plan } from "@prisma/client";

const FREE_PROJECT_LIMIT = 1;

function planLimit(plan: Plan): number {
  if (plan === Plan.free) return FREE_PROJECT_LIMIT;
  return Infinity;
}

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
    select: { id: true, plan: true },
  });
  if (!user) return { ok: false, error: "unauthorized" };

  // Enforce plan limit
  const count = await db.project.count({
    where: { userId: user.id, status: { not: "deleted" } },
  });
  if (count >= planLimit(user.plan)) {
    return { ok: false, error: "plan_limit" };
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

    // TASK-011: triggerAnalysis(project.id, user.id) — stub until queue is built
    void project;

    redirect(`/projects/${project.id}/overview`);
  } catch {
    return { ok: false, error: "unknown" };
  }
}
