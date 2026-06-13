import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RoadmapView, type Roadmap } from "@/features/roadmap/components/RoadmapView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Roadmap — AI CTO" };

export default async function RoadmapPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true, githubOwner: true, githubRepo: true },
  });
  if (!project) notFound();

  const repoName = `${project.githubOwner}/${project.githubRepo}`;

  const latestAnalysis = await db.analysis.findFirst({
    where: { projectId: project.id, status: "complete" },
    orderBy: { createdAt: "desc" },
    select: { id: true, recommendations: true },
  });

  const stored = latestAnalysis?.recommendations;
  const isValidRoadmap =
    stored !== null &&
    stored !== undefined &&
    typeof stored === "object" &&
    !Array.isArray(stored) &&
    "items" in (stored as object);

  const initialRoadmap = isValidRoadmap ? (stored as unknown as Roadmap) : null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Roadmap</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">{repoName}</h1>
      </div>

      <RoadmapView
        analysisId={latestAnalysis?.id ?? ""}
        projectName={repoName}
        initialRoadmap={initialRoadmap}
        hasAnalysis={!!latestAnalysis}
      />
    </div>
  );
}
