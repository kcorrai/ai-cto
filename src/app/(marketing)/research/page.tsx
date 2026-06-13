import type { Metadata } from "next";
import { getBenchmarkSnapshot } from "@/lib/benchmarks/aggregation";
import { BarChart2, TrendingUp, Shield, Zap, TestTube2, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "State of Indie SaaS Quality — AI CTO Research",
  description:
    "Aggregated quality benchmarks from indie SaaS projects analyzed by AI CTO. See how your codebase compares.",
};

export const revalidate = 86400;

const MODULE_ICONS: Record<string, React.ReactNode> = {
  security: <Shield className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />,
  testing: <TestTube2 className="h-4 w-4" />,
  documentation: <FileText className="h-4 w-4" />,
};

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="h-2 w-full rounded-full bg-white/10">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function ResearchPage() {
  const snapshot = await getBenchmarkSnapshot();
  const hasData = snapshot.sampleCount >= 10;

  const now = new Date();
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">AI CTO Research</p>
        <h1 className="text-3xl font-bold text-white">State of Indie SaaS Quality</h1>
        <p className="mt-3 text-zinc-400">
          {quarter} · Aggregated from opt-in analyses on the AI CTO platform
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <BarChart2 className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
          <h2 className="text-lg font-semibold text-zinc-300">Building the dataset</h2>
          <p className="mt-2 text-sm text-zinc-500">
            We need at least 10 opt-in projects to publish benchmarks. Enable benchmark sharing in
            your project settings to contribute.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {snapshot.sampleCount} / 10 projects enrolled so far.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Projects analyzed", value: snapshot.sampleCount.toLocaleString() },
              { label: "Average SaaS Score", value: `${snapshot.overallAvg}/100` },
              { label: "Median score", value: `${snapshot.overallP50}/100` },
              { label: "Top 25% cutoff", value: `${snapshot.overallP75}/100` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Score distribution */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Score Distribution</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Bottom 25%", value: snapshot.overallP25, color: "text-red-400" },
                {
                  label: "Median (50th pct)",
                  value: snapshot.overallP50,
                  color: "text-yellow-400",
                },
                {
                  label: "Top 25% (75th pct)",
                  value: snapshot.overallP75,
                  color: "text-green-400",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="w-40 text-xs text-zinc-500">{row.label}</span>
                  <div className="flex-1">
                    <ScoreBar value={row.value} />
                  </div>
                  <span className={`w-10 text-right text-sm font-semibold ${row.color}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Module benchmarks */}
          {snapshot.modules.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-sm font-semibold text-zinc-200">Module Averages</h2>
              <div className="space-y-3">
                {snapshot.modules
                  .sort((a, b) => a.avg - b.avg)
                  .map((m) => (
                    <div key={m.module} className="flex items-center gap-4">
                      <div className="flex w-44 items-center gap-2 text-xs text-zinc-400">
                        {MODULE_ICONS[m.module] ?? <BarChart2 className="h-4 w-4" />}
                        <span className="capitalize">{m.module.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex-1">
                        <ScoreBar value={m.avg} />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold text-zinc-300">
                        {m.avg}
                      </span>
                      <span className="w-16 text-right text-xs text-zinc-600">
                        n={m.sampleCount}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-zinc-500">
            Data is aggregated and anonymized. No individual project is identifiable.
            <br />
            Last updated:{" "}
            {new Date(snapshot.generatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      )}
    </main>
  );
}
