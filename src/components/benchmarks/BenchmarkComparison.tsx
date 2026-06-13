"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Users } from "lucide-react";
import type { PercentileResult } from "@/lib/benchmarks/aggregation";

type Props = { analysisId: string };

export function BenchmarkComparison({ analysisId }: Props) {
  const [data, setData] = useState<PercentileResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analyses/${analysisId}/percentile`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [analysisId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        <div className="h-16 bg-white/10 rounded" />
      </div>
    );
  }

  if (!data || data.sampleCount < 10) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Benchmark Comparison</h3>
        </div>
        <p className="text-xs text-zinc-500">
          Not enough data yet to generate benchmarks. Enable benchmark sharing in your project
          settings to contribute and unlock percentile rankings once we reach 10+ projects.
        </p>
      </div>
    );
  }

  const pctLabel = (pct: number) => {
    if (pct >= 90) return "top 10%";
    if (pct >= 75) return "top 25%";
    if (pct >= 50) return "above average";
    if (pct >= 25) return "below average";
    return "bottom 25%";
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Benchmark Comparison</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Users className="h-3 w-3" />
          <span>{data.sampleCount} projects</span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4">
        <TrendingUp className="h-8 w-8 text-indigo-400 shrink-0" />
        <div>
          <div className="text-2xl font-bold text-white">Top {100 - data.overall}%</div>
          <div className="text-xs text-zinc-400">
            Your project is {pctLabel(data.overall)} of{" "}
            {data.group === "all" ? "all SaaS projects" : `${data.group} projects`} in the benchmark
            pool
          </div>
        </div>
      </div>

      {Object.keys(data.byModule).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Module Percentiles
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.byModule)
              .sort(([, a], [, b]) => b! - a!)
              .slice(0, 6)
              .map(([mod, pct]) => (
                <div
                  key={mod}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <span className="text-xs text-zinc-400 capitalize">{mod.replace(/_/g, " ")}</span>
                  <span
                    className={`text-xs font-semibold ${
                      pct! >= 75
                        ? "text-green-400"
                        : pct! >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {pct}th pct
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
