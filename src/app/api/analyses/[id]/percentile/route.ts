import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPercentileRank } from "@/lib/benchmarks/aggregation";
import type { ModuleName } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: analysisId } = await params;

  const analysis = await db.analysis.findUnique({
    where: { id: analysisId },
    select: {
      id: true,
      score: true,
      project: { select: { framework: true } },
      modules: { select: { module: true, score: true }, where: { status: "complete" } },
    },
  });

  if (!analysis || !analysis.score) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const moduleScores: Partial<Record<ModuleName, number>> = {};
  for (const m of analysis.modules) {
    if (m.score !== null) moduleScores[m.module] = m.score;
  }

  const result = await getPercentileRank(
    analysis.score,
    moduleScores,
    analysis.project.framework ?? undefined
  );

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
