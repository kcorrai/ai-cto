"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FindingCard } from "./FindingCard";
import type { FindingCardData } from "./FindingCard";

type Severity = "critical" | "high" | "medium" | "low" | "info";
type Filter = "all" | Severity;

export type FlatFinding = FindingCardData;

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

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

type ModuleGroup = { module: string; findings: FlatFinding[] };

function ModuleSection({ group }: { group: ModuleGroup }) {
  const [open, setOpen] = useState(true);
  const name = MODULE_NAMES[group.module] ?? group.module;

  return (
    <div>
      <button
        className="mb-2 flex w-full items-center gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#606060]">
          {name}
        </span>
        <span className="text-xs text-[#606060]">({group.findings.length})</span>
        <ChevronDown
          className="h-3.5 w-3.5 text-[#606060] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="mb-6 space-y-2">
          {group.findings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FindingsList({ findings }: { findings: FlatFinding[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? findings : findings.filter((f) => f.severity === filter);

  const counts: Partial<Record<Filter, number>> = { all: findings.length };
  for (const sev of ["critical", "high", "medium", "low", "info"] as Severity[]) {
    counts[sev] = findings.filter((f) => f.severity === sev).length;
  }

  // Group by module, preserving order of first appearance
  const groups: ModuleGroup[] = [];
  const seen = new Map<string, ModuleGroup>();
  for (const f of filtered) {
    if (!seen.has(f.module)) {
      const g: ModuleGroup = { module: f.module, findings: [] };
      seen.set(f.module, g);
      groups.push(g);
    }
    seen.get(f.module)!.findings.push(f);
  }

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#606060]">
        Findings
      </h2>

      <div className="mb-5 flex flex-wrap gap-1">
        {FILTER_TABS.map(({ key, label }) => {
          const count = counts[key] ?? 0;
          if (key !== "all" && count === 0) return null;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#606060] hover:text-[#f0f0f0]"
              }`}
            >
              {label}
              <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#606060]">No findings match this filter.</p>
      ) : (
        <div>
          {groups.map((g) => (
            <ModuleSection key={g.module} group={g} />
          ))}
        </div>
      )}
    </section>
  );
}
