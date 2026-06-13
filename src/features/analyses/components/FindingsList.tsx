"use client";

import { useState } from "react";
import { ChevronDown, EyeOff, Eye } from "lucide-react";
import { FindingCard } from "./FindingCard";
import type { FindingCardData } from "./FindingCard";
import { LinearPushButton } from "./LinearPushButton";

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

function ModuleSection({
  group,
  readonly,
  selected,
  onToggleSelect,
  isLinearConnected,
}: {
  group: ModuleGroup;
  readonly?: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  isLinearConnected?: boolean;
}) {
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
            <FindingCard
              key={f.id}
              finding={f}
              readonly={readonly ?? false}
              selected={selected.has(f.id)}
              isLinearConnected={isLinearConnected ?? false}
              {...(!readonly && { onToggleSelect })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function bulkResolve(ids: string[]): Promise<void> {
  const res = await fetch("/api/findings/bulk-resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to resolve findings");
}

export function FindingsList({
  findings: initialFindings,
  readonly,
  isLinearConnected = false,
}: {
  findings: FlatFinding[];
  readonly?: boolean;
  isLinearConnected?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [hideResolved, setHideResolved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [findings, setFindings] = useState<FlatFinding[]>(initialFindings);
  const [resolving, setResolving] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const afterHide = hideResolved ? findings.filter((f) => !f.isResolved) : findings;
  const filtered = filter === "all" ? afterHide : afterHide.filter((f) => f.severity === filter);

  const counts: Partial<Record<Filter, number>> = { all: afterHide.length };
  for (const sev of ["critical", "high", "medium", "low", "info"] as Severity[]) {
    counts[sev] = afterHide.filter((f) => f.severity === sev).length;
  }

  // Group by module
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

  const visibleUnresolvedIds = filtered.filter((f) => !f.isResolved).map((f) => f.id);
  const selectedAndVisible = [...selected].filter((id) => visibleUnresolvedIds.includes(id));

  function selectAll() {
    setSelected(new Set(visibleUnresolvedIds));
  }
  function deselectAll() {
    setSelected(new Set());
  }

  async function handleBulkResolve() {
    if (selectedAndVisible.length === 0 || resolving) return;
    setResolving(true);
    try {
      await bulkResolve(selectedAndVisible);
      setFindings((prev) =>
        prev.map((f) => (selectedAndVisible.includes(f.id) ? { ...f, isResolved: true } : f))
      );
      setSelected(new Set());
    } finally {
      setResolving(false);
    }
  }

  const resolvedCount = findings.filter((f) => f.isResolved).length;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-xs font-semibold uppercase tracking-wider text-[#606060]">
          Findings
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {!readonly && selectedAndVisible.length > 0 && (
            <>
              <button
                onClick={() => void handleBulkResolve()}
                disabled={resolving}
                className="rounded-md border border-[#22c55e]/30 bg-[#111111] px-3 py-1 text-xs font-medium text-[#22c55e] transition-colors hover:border-[#22c55e]/60 disabled:opacity-50"
              >
                {resolving ? "Resolving…" : `Resolve selected (${selectedAndVisible.length})`}
              </button>
              <LinearPushButton
                findingIds={selectedAndVisible}
                isLinearConnected={isLinearConnected}
              />
            </>
          )}
          {!readonly && selectedAndVisible.length > 0 ? (
            <button onClick={deselectAll} className="text-xs text-[#606060] hover:text-[#a0a0a0]">
              Deselect all
            </button>
          ) : !readonly && visibleUnresolvedIds.length > 0 ? (
            <button onClick={selectAll} className="text-xs text-[#606060] hover:text-[#a0a0a0]">
              Select all
            </button>
          ) : null}
          {resolvedCount > 0 && (
            <button
              onClick={() => setHideResolved((h) => !h)}
              className="flex items-center gap-1 text-xs text-[#606060] hover:text-[#a0a0a0]"
              title={hideResolved ? "Show resolved" : "Hide resolved"}
            >
              {hideResolved ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hideResolved ? "Show resolved" : "Hide resolved"}
              {!hideResolved && <span className="ml-0.5 text-[#404040]">({resolvedCount})</span>}
            </button>
          )}
        </div>
      </div>

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
        <p className="py-8 text-center text-sm text-[#606060]">
          {hideResolved && findings.filter((f) => f.isResolved).length > 0
            ? "All visible findings are resolved."
            : "No findings match this filter."}
        </p>
      ) : (
        <div>
          {groups.map((g) => (
            <ModuleSection
              key={g.module}
              group={g}
              readonly={readonly ?? false}
              selected={selected}
              onToggleSelect={toggleSelect}
              isLinearConnected={isLinearConnected}
            />
          ))}
        </div>
      )}
    </section>
  );
}
