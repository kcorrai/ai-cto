import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "A/B Testing — Admin" };

const MODULE_NAMES: Record<string, string> = {
  architecture: "Architecture",
  code_quality: "Code Quality",
  security: "Security",
  dependencies: "Dependencies",
  product_readiness: "Product Readiness",
  performance: "Performance",
  testing: "Testing",
  documentation: "Documentation",
  api_design: "API Design",
  database: "Database",
  devops: "DevOps",
  saas_maturity: "SaaS Maturity",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

type RawOutput = { promptVariant?: string };

export default async function AdminABTestingPage() {
  const modules = await db.analysisModule.findMany({
    where: { status: "complete" },
    select: { module: true, rawOutput: true, score: true },
    take: 5000,
  });

  type VariantStats = { scores: number[]; count: number };
  const stats: Record<string, Record<string, VariantStats>> = {};

  for (const m of modules) {
    const variant = (m.rawOutput as RawOutput)?.promptVariant ?? "v1";
    if (!stats[m.module]) stats[m.module] = {};
    if (!stats[m.module]![variant]) stats[m.module]![variant] = { scores: [], count: 0 };
    if (m.score !== null) stats[m.module]![variant]!.scores.push(m.score);
    stats[m.module]![variant]!.count++;
  }

  const rows = Object.entries(stats)
    .map(([mod, variants]) => ({
      mod,
      name: MODULE_NAMES[mod] ?? mod,
      variants: Object.entries(variants)
        .map(([variant, s]) => ({
          variant,
          count: s.count,
          avg:
            s.scores.length > 0
              ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
              : null,
        }))
        .sort((a, b) => a.variant.localeCompare(b.variant)),
    }))
    .filter((r) => r.variants.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const activeVariants = new Set(
    rows
      .flatMap((r) => r.variants.map((v) => `${r.mod}=${v.variant}`))
      .filter((s) => s.includes("v2"))
  );

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <div className="mb-2 flex items-center gap-3">
        <Link href="/admin/feedback" className="text-xs text-[#3b82f6] hover:underline">
          ← Feedback
        </Link>
        <Link href="/admin/quality" className="text-xs text-[#3b82f6] hover:underline">
          Quality
        </Link>
      </div>
      <h1 className="mb-1 text-xl font-semibold text-[#f0f0f0]">Prompt A/B Testing</h1>
      <p className="mb-2 text-xs text-[#606060]">
        Enable variant v2 for a module by setting env var{" "}
        <code className="font-mono text-[#a0a0a0]">PROMPT_VARIANT_&lt;MODULE&gt;=v2</code>. Scores
        are averaged per variant so you can compare prompt quality.
      </p>

      {activeVariants.size === 0 && (
        <div className="mb-4 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3">
          <p className="text-xs text-[#606060]">
            No v2 variants active. All modules are using <code className="font-mono">v1</code>{" "}
            (default). Set{" "}
            <code className="font-mono text-[#a0a0a0]">PROMPT_VARIANT_SECURITY=v2</code> to start an
            A/B test.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.mod} className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#f0f0f0]">{r.name}</span>
              <div className="flex items-center gap-4">
                {r.variants.map((v) => (
                  <div key={v.variant} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#606060]">{v.variant}</span>
                    {v.avg !== null ? (
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: scoreColor(v.avg) }}
                      >
                        {v.avg}
                      </span>
                    ) : (
                      <span className="text-xs text-[#404040]">—</span>
                    )}
                    <span className="text-xs text-[#404040]">({v.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
