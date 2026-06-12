import type { ModuleName, ModuleStatus } from "@prisma/client";

const MODULE_NAMES: Partial<Record<ModuleName, string>> = {
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

function scoreTrackColor(score: number): string {
  if (score >= 80) return "#14532d";
  if (score >= 65) return "#1e3a5f";
  if (score >= 50) return "#451a03";
  if (score >= 35) return "#431407";
  return "#450a0a";
}

type ModuleRecord = {
  module: ModuleName;
  score: number | null;
  status: ModuleStatus;
};

function ModuleCard({ record }: { record: ModuleRecord }) {
  const name = MODULE_NAMES[record.module] ?? record.module;
  const score = record.score ?? 0;
  const color = scoreColor(score);
  const track = scoreTrackColor(score);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#a0a0a0]">{name}</span>
        {record.status === "failed" ? (
          <span className="text-xs text-[#ef4444]">Failed</span>
        ) : (
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>
            {score}
            <span className="text-xs font-normal text-[#606060]">/100</span>
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: track }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ModuleGrid({ modules }: { modules: ModuleRecord[] }) {
  if (modules.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
        Module Scores
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <ModuleCard key={m.module} record={m} />
        ))}
      </div>
    </section>
  );
}
