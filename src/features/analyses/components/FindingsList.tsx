"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X, SlidersHorizontal } from "lucide-react";
import { FindingCard } from "./FindingCard";
import type { FindingCardData } from "./FindingCard";
import { LinearPushButton } from "./LinearPushButton";

type Severity = "critical" | "high" | "medium" | "low" | "info";
type StatusFilter = "all" | "unresolved" | "resolved";

export type FlatFinding = FindingCardData;

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

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

const SEVERITY_CHIP: Record<Severity, { active: string; inactive: string }> = {
  critical: {
    active: "bg-[#ef4444] border-[#ef4444] text-white",
    inactive: "border-[#ef4444]/30 text-[#ef4444] hover:border-[#ef4444]/60",
  },
  high: {
    active: "bg-[#f97316] border-[#f97316] text-white",
    inactive: "border-[#f97316]/30 text-[#f97316] hover:border-[#f97316]/60",
  },
  medium: {
    active: "bg-[#f59e0b] border-[#f59e0b] text-white",
    inactive: "border-[#f59e0b]/30 text-[#f59e0b] hover:border-[#f59e0b]/60",
  },
  low: {
    active: "bg-[#3b82f6] border-[#3b82f6] text-white",
    inactive: "border-[#3b82f6]/30 text-[#3b82f6] hover:border-[#3b82f6]/60",
  },
  info: {
    active: "bg-[#71717a] border-[#71717a] text-white",
    inactive: "border-[#71717a]/30 text-[#71717a] hover:border-[#71717a]/60",
  },
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

function syncUrlParams(
  router: ReturnType<typeof useRouter>,
  q: string,
  severities: Set<Severity>,
  module: string,
  status: StatusFilter
) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (q) params.set("q", q);
  else params.delete("q");
  if (severities.size > 0) params.set("severity", [...severities].join(","));
  else params.delete("severity");
  if (module) params.set("module", module);
  else params.delete("module");
  if (status !== "all") params.set("status", status);
  else params.delete("status");
  const qs = params.toString();
  router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname, {
    scroll: false,
  });
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedSeverities, setSelectedSeverities] = useState<Set<Severity>>(() => {
    const raw = searchParams.get("severity");
    if (!raw) return new Set<Severity>();
    return new Set(raw.split(",").filter((s): s is Severity => SEVERITIES.includes(s as Severity)));
  });
  const [selectedModule, setSelectedModule] = useState(() => searchParams.get("module") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const raw = searchParams.get("status");
    return raw === "unresolved" || raw === "resolved" ? raw : "all";
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [findings, setFindings] = useState<FlatFinding[]>(initialFindings);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resolving, setResolving] = useState(false);

  // Refs for URL sync to avoid stale closures
  const queryRef = useRef(query);
  const severitiesRef = useRef(selectedSeverities);
  const moduleRef = useRef(selectedModule);
  const statusRef = useRef(statusFilter);

  const availableModules = useMemo(
    () => Array.from(new Set(findings.map((f) => f.module))).sort(),
    [findings]
  );

  const filtered = useMemo(() => {
    let result = findings;
    if (statusFilter === "unresolved") result = result.filter((f) => !f.isResolved);
    else if (statusFilter === "resolved") result = result.filter((f) => f.isResolved);
    if (selectedSeverities.size > 0)
      result = result.filter((f) => selectedSeverities.has(f.severity as Severity));
    if (selectedModule) result = result.filter((f) => f.module === selectedModule);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) => f.title.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [findings, statusFilter, selectedSeverities, selectedModule, query]);

  const groups = useMemo(() => {
    const result: ModuleGroup[] = [];
    const seen = new Map<string, ModuleGroup>();
    for (const f of filtered) {
      if (!seen.has(f.module)) {
        const g: ModuleGroup = { module: f.module, findings: [] };
        seen.set(f.module, g);
        result.push(g);
      }
      seen.get(f.module)!.findings.push(f);
    }
    return result;
  }, [filtered]);

  const visibleUnresolvedIds = useMemo(
    () => filtered.filter((f) => !f.isResolved).map((f) => f.id),
    [filtered]
  );
  const selectedAndVisible = useMemo(
    () => [...selected].filter((id) => visibleUnresolvedIds.includes(id)),
    [selected, visibleUnresolvedIds]
  );

  const hasActiveFilters =
    query !== "" || selectedSeverities.size > 0 || selectedModule !== "" || statusFilter !== "all";

  const activeFilterCount =
    (selectedSeverities.size > 0 ? 1 : 0) +
    (selectedModule ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0);

  function handleQueryChange(value: string) {
    setQuery(value);
    queryRef.current = value;
    syncUrlParams(router, value, severitiesRef.current, moduleRef.current, statusRef.current);
  }

  function handleToggleSeverity(sev: Severity) {
    const next = new Set(selectedSeverities);
    if (next.has(sev)) next.delete(sev);
    else next.add(sev);
    setSelectedSeverities(next);
    severitiesRef.current = next;
    syncUrlParams(router, queryRef.current, next, moduleRef.current, statusRef.current);
  }

  function handleModuleChange(value: string) {
    setSelectedModule(value);
    moduleRef.current = value;
    syncUrlParams(router, queryRef.current, severitiesRef.current, value, statusRef.current);
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    statusRef.current = value;
    syncUrlParams(router, queryRef.current, severitiesRef.current, moduleRef.current, value);
  }

  function clearFilters() {
    setQuery("");
    setSelectedSeverities(new Set());
    setSelectedModule("");
    setStatusFilter("all");
    queryRef.current = "";
    severitiesRef.current = new Set();
    moduleRef.current = "";
    statusRef.current = "all";
    syncUrlParams(router, "", new Set(), "", "all");
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  return (
    <section>
      {/* Header */}
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
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[#606060] hover:text-[#a0a0a0]"
            >
              Deselect all
            </button>
          ) : !readonly && visibleUnresolvedIds.length > 0 ? (
            <button
              onClick={() => setSelected(new Set(visibleUnresolvedIds))}
              className="text-xs text-[#606060] hover:text-[#a0a0a0]"
            >
              Select all
            </button>
          ) : null}
        </div>
      </div>

      {/* Filter panel */}
      <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-3">
        {/* Search row + mobile toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#606060]" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search findings…"
              aria-label="Search findings"
              className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] py-1.5 pl-8 pr-7 text-xs text-[#f0f0f0] placeholder-[#404040] outline-none focus:border-[#404040]"
            />
            {query && (
              <button
                onClick={() => handleQueryChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#606060] hover:text-[#a0a0a0]"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Mobile: filters toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors sm:hidden ${
              filtersOpen || hasActiveFilters
                ? "border-[#3b82f6]/40 text-[#3b82f6]"
                : "border-[#2a2a2a] text-[#606060]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop: clear button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="hidden items-center gap-1 text-xs text-[#606060] hover:text-[#a0a0a0] sm:flex"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Filter chips — always visible on sm+, collapsible on mobile */}
        <div className={`mt-2.5 ${filtersOpen ? "block" : "hidden sm:block"}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status toggle */}
            {(["all", "unresolved", "resolved"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-[#3b82f6] text-white"
                    : "bg-[#1a1a1a] text-[#606060] hover:text-[#f0f0f0]"
                }`}
              >
                {s}
              </button>
            ))}

            <span className="select-none text-[#2a2a2a]">|</span>

            {/* Severity multi-select chips */}
            {SEVERITIES.map((sev) => {
              const count = findings.filter((f) => f.severity === sev).length;
              if (count === 0) return null;
              const active = selectedSeverities.has(sev);
              const { active: activeClass, inactive: inactiveClass } = SEVERITY_CHIP[sev];
              return (
                <button
                  key={sev}
                  onClick={() => handleToggleSeverity(sev)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                    active ? activeClass : `bg-[#1a1a1a] ${inactiveClass}`
                  }`}
                >
                  {sev} <span className="opacity-70">{count}</span>
                </button>
              );
            })}

            <span className="select-none text-[#2a2a2a]">|</span>

            {/* Module dropdown */}
            <div className="relative">
              <select
                value={selectedModule}
                onChange={(e) => handleModuleChange(e.target.value)}
                aria-label="Filter by module"
                className={`cursor-pointer appearance-none rounded-full border bg-[#1a1a1a] py-0.5 pl-2.5 pr-6 text-xs outline-none transition-colors ${
                  selectedModule
                    ? "border-[#3b82f6]/40 text-[#3b82f6]"
                    : "border-[#2a2a2a] text-[#606060] hover:text-[#f0f0f0]"
                }`}
              >
                <option value="">All modules</option>
                {availableModules.map((mod) => (
                  <option key={mod} value={mod}>
                    {MODULE_NAMES[mod] ?? mod}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#606060]" />
            </div>

            {/* Mobile: clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-[#606060] hover:text-[#a0a0a0] sm:hidden"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="mb-3 text-xs text-[#606060]">
        Showing {filtered.length} of {findings.length} finding
        {findings.length !== 1 ? "s" : ""}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#606060]">
          {hasActiveFilters ? "No findings match your filters." : "No findings to display."}
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
