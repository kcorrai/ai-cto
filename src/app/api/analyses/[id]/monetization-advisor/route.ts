import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adviseOnMonetization } from "@/lib/ai/monetization-advisor";

type StoredMetadata = Record<string, unknown>;

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
  return NextResponse.json({ result: meta?.monetizationAdvisor ?? null });
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

  const findings = await db.finding.findMany({
    where: { analysisId: id, module: { in: ["saas_maturity", "product_readiness"] } },
    select: { title: true, severity: true, module: true, recommendation: true },
    orderBy: { severity: "asc" },
  });

  const techStack: string[] = [];
  if (analysis.project.language) techStack.push(analysis.project.language);
  if (analysis.project.framework) techStack.push(analysis.project.framework);
  const extra = analysis.project.techStack;
  if (Array.isArray(extra)) techStack.push(...(extra as string[]).slice(0, 5));

  const result = await adviseOnMonetization({
    projectName: `${analysis.project.githubOwner}/${analysis.project.githubRepo}`,
    saasMaturityScore: (breakdown?.saas_maturity as number | undefined) ?? 0,
    saasMaturityFindings: findings
      .filter((f) => f.module === "saas_maturity")
      .map((f) => ({
        title: f.title,
        severity: f.severity as string,
        ...(f.recommendation ? { recommendation: f.recommendation } : {}),
      })),
    productReadinessFindings: findings
      .filter((f) => f.module === "product_readiness")
      .map((f) => ({ title: f.title, severity: f.severity as string })),
    techStack: [...new Set(techStack)],
  });

  const stored = { generatedAt: new Date().toISOString(), ...result };
  const meta = (analysis.metadata as StoredMetadata) ?? {};
  await db.analysis.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { metadata: { ...meta, monetizationAdvisor: stored } as any },
  });
  return NextResponse.json({ result: stored });
}
