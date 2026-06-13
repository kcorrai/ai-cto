import { db } from "@/lib/db";
import type { ModuleName } from "@prisma/client";

export type BenchmarkGroup = "all" | string;

export type ModuleBenchmark = {
  module: ModuleName;
  avg: number;
  p25: number;
  p50: number;
  p75: number;
  sampleCount: number;
};

export type BenchmarkSnapshot = {
  group: BenchmarkGroup;
  overallAvg: number;
  overallP25: number;
  overallP50: number;
  overallP75: number;
  sampleCount: number;
  modules: ModuleBenchmark[];
  generatedAt: string;
};

export type PercentileResult = {
  overall: number;
  byModule: Partial<Record<ModuleName, number>>;
  group: BenchmarkGroup;
  sampleCount: number;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (idx - lower);
}

export async function getBenchmarkSnapshot(framework?: string): Promise<BenchmarkSnapshot> {
  const projectWhere = {
    benchmarkOptIn: true,
    status: "active" as const,
    ...(framework ? { framework } : {}),
  };

  const projects = await db.project.findMany({
    where: projectWhere,
    select: { id: true },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length < 10) {
    return {
      group: framework ?? "all",
      overallAvg: 0,
      overallP25: 0,
      overallP50: 0,
      overallP75: 0,
      sampleCount: projectIds.length,
      modules: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Get latest completed analysis per project
  const latestAnalyses = await db.$queryRaw<{ id: string; score: number | null }[]>`
    SELECT DISTINCT ON (project_id) id, score
    FROM analyses
    WHERE project_id = ANY(${projectIds}::uuid[])
      AND status = 'complete'
      AND score IS NOT NULL
    ORDER BY project_id, created_at DESC
  `;

  const analysisIds = latestAnalyses.map((a) => a.id);
  const overallScores = latestAnalyses
    .map((a) => a.score!)
    .filter((s) => s > 0)
    .sort((a, b) => a - b);

  // Get module scores for those analyses
  const moduleScores = await db.analysisModule.findMany({
    where: { analysisId: { in: analysisIds }, status: "complete" },
    select: { module: true, score: true },
  });

  // Group scores by module
  const byModule: Partial<Record<ModuleName, number[]>> = {};
  for (const m of moduleScores) {
    if (m.score === null) continue;
    if (!byModule[m.module]) byModule[m.module] = [];
    byModule[m.module]!.push(m.score);
  }

  const modules: ModuleBenchmark[] = Object.entries(byModule)
    .filter(([, scores]) => scores!.length >= 5)
    .map(([mod, scores]) => {
      const sorted = [...scores!].sort((a, b) => a - b);
      return {
        module: mod as ModuleName,
        avg: Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length),
        p25: Math.round(percentile(sorted, 25)),
        p50: Math.round(percentile(sorted, 50)),
        p75: Math.round(percentile(sorted, 75)),
        sampleCount: sorted.length,
      };
    });

  return {
    group: framework ?? "all",
    overallAvg:
      overallScores.length > 0
        ? Math.round(overallScores.reduce((s, v) => s + v, 0) / overallScores.length)
        : 0,
    overallP25: Math.round(percentile(overallScores, 25)),
    overallP50: Math.round(percentile(overallScores, 50)),
    overallP75: Math.round(percentile(overallScores, 75)),
    sampleCount: overallScores.length,
    modules,
    generatedAt: new Date().toISOString(),
  };
}

export async function getPercentileRank(
  score: number,
  moduleScores: Partial<Record<ModuleName, number>>,
  framework?: string
): Promise<PercentileResult> {
  const snapshot = await getBenchmarkSnapshot(framework ?? undefined);

  if (snapshot.sampleCount < 10) {
    return {
      overall: 0,
      byModule: {},
      group: snapshot.group,
      sampleCount: snapshot.sampleCount,
    };
  }

  // Overall percentile: percentage of projects this score is better than
  const projectWhere = {
    benchmarkOptIn: true,
    status: "active" as const,
    ...(framework ? { framework } : {}),
  };

  const projectIds = (await db.project.findMany({ where: projectWhere, select: { id: true } })).map(
    (p) => p.id
  );

  const latestAnalyses = await db.$queryRaw<{ score: number }[]>`
    SELECT DISTINCT ON (project_id) score
    FROM analyses
    WHERE project_id = ANY(${projectIds}::uuid[])
      AND status = 'complete'
      AND score IS NOT NULL
    ORDER BY project_id, created_at DESC
  `;

  const allScores = latestAnalyses.map((a) => a.score).filter((s) => s > 0);
  const overallPct =
    allScores.length > 0
      ? Math.round((allScores.filter((s) => s < score).length / allScores.length) * 100)
      : 0;

  const byModule: Partial<Record<ModuleName, number>> = {};
  for (const bench of snapshot.modules) {
    const myScore = moduleScores[bench.module];
    if (myScore === undefined) continue;
    const sorted = [bench.p25, bench.p50, bench.p75];
    // Simple linear interpolation for percentile
    if (myScore <= bench.p25) byModule[bench.module] = Math.round((myScore / bench.p25) * 25);
    else if (myScore <= bench.p50)
      byModule[bench.module] =
        25 + Math.round(((myScore - bench.p25) / (bench.p50 - bench.p25)) * 25);
    else if (myScore <= bench.p75)
      byModule[bench.module] =
        50 + Math.round(((myScore - bench.p50) / (bench.p75 - bench.p50)) * 25);
    else byModule[bench.module] = 75 + Math.round(((myScore - bench.p75) / (100 - bench.p75)) * 25);
    void sorted;
  }

  return {
    overall: overallPct,
    byModule,
    group: snapshot.group,
    sampleCount: allScores.length,
  };
}
