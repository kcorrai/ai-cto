import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessLaunchReadiness } from "@/lib/ai/launch-readiness";
import type { ModuleName } from "@prisma/client";

type StoredMetadata = {
  launchReadiness?: unknown;
  competitorAnalysis?: unknown;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analysis = await db.analysis.findFirst({
    where: { id, project: { userId: user.id } },
    select: { metadata: true },
  });
  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const meta = analysis.metadata as StoredMetadata | null;
  return NextResponse.json({ result: meta?.launchReadiness ?? null });
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
      metadata: true,
      project: { select: { githubOwner: true, githubRepo: true } },
    },
  });
  if (!analysis)
    return NextResponse.json({ error: "Analysis not found or not complete" }, { status: 404 });

  const breakdown = analysis.scoreBreakdown as Record<string, unknown> | null;
  const moduleScores: Record<string, number> = {};
  if (breakdown) {
    for (const [key, value] of Object.entries(breakdown)) {
      if (key !== "label" && typeof value === "number") {
        moduleScores[key as ModuleName] = value;
      }
    }
  }

  const findings = await db.finding.findMany({
    where: { analysisId: id },
    select: { title: true, severity: true, module: true, recommendation: true },
    orderBy: { severity: "asc" },
  });

  const criticalFindings = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 15)
    .map((f) => ({
      title: f.title,
      severity: f.severity as string,
      module: f.module,
      ...(f.recommendation ? { recommendation: f.recommendation } : {}),
    }));

  const result = await assessLaunchReadiness({
    projectName: `${analysis.project.githubOwner}/${analysis.project.githubRepo}`,
    score: analysis.score ?? 0,
    moduleScores,
    criticalFindings,
    allFindingTitles: findings.map((f) => f.title),
  });

  const stored = { generatedAt: new Date().toISOString(), ...result };
  const existingMeta = (analysis.metadata as StoredMetadata) ?? {};
  await db.analysis.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { metadata: { ...existingMeta, launchReadiness: stored } as any },
  });

  return NextResponse.json({ result: stored });
}
