import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRoadmap } from "@/lib/ai/roadmap";
import type { ModuleName } from "@prisma/client";

type RoadmapStored = {
  summary: string;
  generatedAt: string;
  items: unknown[];
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analysis = await db.analysis.findFirst({
    where: { id, project: { userId: user.id } },
    select: { recommendations: true, status: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stored = analysis.recommendations as RoadmapStored | null;
  const hasRoadmap =
    stored && typeof stored === "object" && !Array.isArray(stored) && "items" in stored;

  return NextResponse.json({ roadmap: hasRoadmap ? stored : null });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analysis = await db.analysis.findFirst({
    where: { id, project: { userId: user.id }, status: "complete" },
    select: {
      id: true,
      score: true,
      scoreBreakdown: true,
      project: { select: { githubOwner: true, githubRepo: true } },
    },
  });
  if (!analysis)
    return NextResponse.json({ error: "Analysis not found or not complete" }, { status: 404 });

  const breakdown = analysis.scoreBreakdown as Record<string, unknown> | null;
  const moduleScores: Partial<Record<ModuleName, number>> = {};
  if (breakdown) {
    for (const [key, value] of Object.entries(breakdown)) {
      if (key !== "label" && typeof value === "number") {
        moduleScores[key as ModuleName] = value;
      }
    }
  }

  const findings = await db.finding.findMany({
    where: { analysisId: id },
    select: {
      title: true,
      severity: true,
      module: true,
      recommendation: true,
      effort: true,
      impact: true,
    },
    orderBy: [{ severity: "asc" }],
  });

  const allFindings = findings.map((f) => ({
    title: f.title,
    severity: f.severity as string,
    module: f.module,
    ...(f.recommendation ? { recommendation: f.recommendation } : {}),
    ...(f.effort ? { effort: f.effort as string } : {}),
    ...(f.impact ? { impact: f.impact as string } : {}),
  }));

  const result = await generateRoadmap({
    projectName: `${analysis.project.githubOwner}/${analysis.project.githubRepo}`,
    score: analysis.score ?? 0,
    moduleScores,
    allFindings,
  });

  const stored: RoadmapStored = {
    summary: result.summary,
    generatedAt: new Date().toISOString(),
    items: result.items,
  };

  await db.analysis.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { recommendations: stored as any },
  });

  return NextResponse.json({ roadmap: stored });
}
