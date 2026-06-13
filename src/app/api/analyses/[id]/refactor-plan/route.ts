import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planRefactors } from "@/lib/ai/refactor-planner";

type StoredMetadata = Record<string, unknown>;

type DebtItem = {
  title: string;
  category: string;
  description: string;
  priority: string;
  effortDaysMin: number;
  effortDaysMax: number;
};

type TechDebtStored = {
  items?: DebtItem[];
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
  return NextResponse.json({ result: meta?.refactorPlan ?? null });
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
      metadata: true,
      project: { select: { githubOwner: true, githubRepo: true } },
    },
  });
  if (!analysis)
    return NextResponse.json({ error: "Analysis not found or not complete" }, { status: 404 });

  const meta = (analysis.metadata as StoredMetadata) ?? {};
  const techDebt = meta.technicalDebt as TechDebtStored | undefined;

  const findings = await db.finding.findMany({
    where: { analysisId: id, module: { in: ["code_quality", "architecture"] } },
    select: { title: true, severity: true, module: true, filePath: true, recommendation: true },
    orderBy: { severity: "asc" },
    take: 20,
  });

  function pickByModule(module: string) {
    return findings
      .filter((f) => f.module === module)
      .map((f) => ({
        title: f.title,
        severity: f.severity as string,
        ...(f.filePath ? { filePath: f.filePath } : {}),
        ...(f.recommendation ? { recommendation: f.recommendation } : {}),
      }));
  }

  const result = await planRefactors({
    projectName: `${analysis.project.githubOwner}/${analysis.project.githubRepo}`,
    techDebtItems: (techDebt?.items ?? []).map((item) => ({
      title: item.title,
      category: item.category,
      description: item.description,
      priority: item.priority,
      effortDaysMin: item.effortDaysMin,
      effortDaysMax: item.effortDaysMax,
    })),
    codeQualityFindings: pickByModule("code_quality"),
    architectureFindings: pickByModule("architecture"),
  });

  const stored = { generatedAt: new Date().toISOString(), ...result };
  await db.analysis.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { metadata: { ...meta, refactorPlan: stored } as any },
  });

  return NextResponse.json({ result: stored });
}
