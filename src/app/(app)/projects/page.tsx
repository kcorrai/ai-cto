import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { Plus } from "lucide-react";
import { cacheGet, cacheSet, cacheKeys, cacheTTL } from "@/lib/cache";
import { ProjectList, type ProjectRow } from "@/features/projects/components/ProjectList";

export default async function ProjectsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  const projectsCacheKey = cacheKeys.userProjects(user.id);
  let projects: ProjectRow[];
  const cachedProjects = await cacheGet<ProjectRow[]>(projectsCacheKey);
  if (cachedProjects) {
    projects = cachedProjects;
  } else {
    projects = await db.project.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        githubOwner: true,
        githubRepo: true,
        tags: true,
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, score: true },
        },
      },
    });
    await cacheSet(projectsCacheKey, projects, cacheTTL.userProjects);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#f0f0f0]">Projects</h2>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      <Suspense>
        <ProjectList projects={projects} />
      </Suspense>
    </div>
  );
}
