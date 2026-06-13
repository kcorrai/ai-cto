import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeCompetitors } from "@/lib/ai/competitor";
import type { ModuleName } from "@prisma/client";

type StoredCompetitor = {
  generatedAt: string;
  inferredCategory: string;
  competitors: string[];
  gaps: unknown[];
  presentFeatures: string[];
  disclaimer: string;
};

type StoredMetadata = {
  competitorAnalysis?: StoredCompetitor;
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
  const result = meta?.competitorAnalysis ?? null;
  return NextResponse.json({ result });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { competitors?: string[] };
  const competitorNames = Array.isArray(body.competitors)
    ? body.competitors.filter(Boolean)
    : undefined;

  const analysis = await db.analysis.findFirst({
    where: { id, project: { userId: user.id }, status: "complete" },
    select: {
      id: true,
      score: true,
      scoreBreakdown: true,
      metadata: true,
      project: {
        select: {
          githubOwner: true,
          githubRepo: true,
          techStack: true,
          language: true,
          framework: true,
        },
      },
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
    select: { title: true, severity: true, module: true },
    orderBy: { severity: "asc" },
    take: 10,
  });

  const techStack: string[] = [];
  if (analysis.project.language) techStack.push(analysis.project.language);
  if (analysis.project.framework) techStack.push(analysis.project.framework);
  const extraStack = analysis.project.techStack;
  if (Array.isArray(extraStack)) {
    techStack.push(...(extraStack as string[]).slice(0, 5));
  }

  const resolvedCompetitors = competitorNames?.length ? competitorNames : undefined;
  const result = await analyzeCompetitors({
    projectName: `${analysis.project.githubOwner}/${analysis.project.githubRepo}`,
    techStack: [...new Set(techStack)],
    ...(resolvedCompetitors ? { competitorNames: resolvedCompetitors } : {}),
    fileList: [],
    configFiles: [],
    topFindings: findings.map((f) => ({
      title: f.title,
      severity: f.severity as string,
      module: f.module,
    })),
    moduleScores,
  });

  const stored: StoredCompetitor = {
    generatedAt: new Date().toISOString(),
    ...result,
  };

  const existingMeta = (analysis.metadata as StoredMetadata) ?? {};
  await db.analysis.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { metadata: { ...existingMeta, competitorAnalysis: stored } as any },
  });

  return NextResponse.json({ result: stored });
}
