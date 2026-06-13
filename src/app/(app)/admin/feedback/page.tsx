import { db } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feedback Stats — Admin" };

type FeedbackMeta = { feedback?: { vote: "up" | "down"; note?: string; createdAt: string } };

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

function approvalColor(rate: number): string {
  if (rate >= 80) return "#22c55e";
  if (rate >= 60) return "#f59e0b";
  return "#ef4444";
}

export default async function AdminFeedbackPage() {
  const findings = await db.finding.findMany({
    select: { module: true, metadata: true, title: true, severity: true },
    take: 5000,
  });

  type ModuleStat = {
    up: number;
    down: number;
    notes: { title: string; note: string; severity: string }[];
  };
  const stats: Record<string, ModuleStat> = {};

  for (const f of findings) {
    const meta = f.metadata as FeedbackMeta;
    if (!meta?.feedback) continue;
    if (!stats[f.module]) stats[f.module] = { up: 0, down: 0, notes: [] };
    if (meta.feedback.vote === "up") {
      stats[f.module]!.up++;
    } else {
      stats[f.module]!.down++;
      if (meta.feedback.note) {
        stats[f.module]!.notes.push({
          title: f.title,
          note: meta.feedback.note,
          severity: f.severity,
        });
      }
    }
  }

  const rows = Object.entries(stats)
    .map(([module, s]) => ({
      module,
      name: MODULE_NAMES[module] ?? module,
      up: s.up,
      down: s.down,
      total: s.up + s.down,
      rate: s.up + s.down > 0 ? Math.round((s.up / (s.up + s.down)) * 100) : null,
      notes: s.notes,
    }))
    .sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100));

  const totalWithFeedback = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <div className="mb-2 flex items-center gap-2">
        <Link href="/admin/quality" className="text-xs text-[#3b82f6] hover:underline">
          Quality →
        </Link>
      </div>
      <h1 className="mb-1 text-xl font-semibold text-[#f0f0f0]">Prompt Improvement Pipeline</h1>
      <p className="mb-6 text-xs text-[#606060]">
        {totalWithFeedback} rated findings across {rows.length} modules. Lowest approval rates
        surface which prompts need work.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-sm text-[#606060]">No feedback collected yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.module} className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
              {/* Header row */}
              <div className="flex items-center gap-4 px-4 py-3">
                <span className="w-40 shrink-0 text-sm font-medium text-[#f0f0f0]">{r.name}</span>
                <div className="flex flex-1 items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                    {r.rate !== null && (
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r.rate}%`, backgroundColor: approvalColor(r.rate) }}
                      />
                    )}
                  </div>
                  {r.rate !== null && (
                    <span
                      className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
                      style={{ color: approvalColor(r.rate) }}
                    >
                      {r.rate}%
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-3 text-xs text-[#606060]">
                  <span className="text-[#22c55e]">↑ {r.up}</span>
                  <span className="text-[#ef4444]">↓ {r.down}</span>
                </div>
              </div>

              {/* Negative notes */}
              {r.notes.length > 0 && (
                <div className="border-t border-[#1a1a1a] px-4 pb-3 pt-2">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                    Negative notes ({r.notes.length})
                  </p>
                  <div className="space-y-2">
                    {r.notes.map((n, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-2.5"
                      >
                        <p className="text-xs font-medium text-[#a0a0a0]">{n.title}</p>
                        <p className="mt-1 text-xs text-[#606060]">&ldquo;{n.note}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
