"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, BarChart2, ExternalLink, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  latestScore: number | null;
  lastAnalyzedAt: Date | null;
  analysisCount: number;
  githubOwner: string | null;
  githubRepo: string | null;
};

type SortKey = "name" | "score" | "lastAnalyzed";
type SortDir = "asc" | "desc";

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const [sort, setSort] = useState<SortKey>("lastAnalyzed");
  const [dir, setDir] = useState<SortDir>("desc");
  const [query, setQuery] = useState("");

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const filtered = projects.filter(
      (p) =>
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        `${p.githubOwner}/${p.githubRepo}`.toLowerCase().includes(query.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sort === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sort === "score") {
        cmp = (a.latestScore ?? -1) - (b.latestScore ?? -1);
      } else {
        cmp = (a.lastAnalyzedAt?.getTime() ?? 0) - (b.lastAnalyzedAt?.getTime() ?? 0);
      }
      return dir === "asc" ? cmp : -cmp;
    });
  }, [projects, sort, dir, query]);

  function scoreColor(score: number) {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter projects…"
          className="h-9 w-full max-w-xs rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-sm text-[#f0f0f0] placeholder-[#606060] focus:border-[#3b82f6] focus:outline-none"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-12 text-center">
          <FolderKanban className="mx-auto mb-3 h-8 w-8 text-[#404040]" />
          <p className="text-sm text-[#606060]">
            {query ? "No projects match your filter." : "No projects yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-[#1f1f1f] px-4 py-2">
            <SortButton
              label="Project"
              sortKey="name"
              current={sort}
              dir={dir}
              onSort={toggleSort}
            />
            <SortButton
              label="Score"
              sortKey="score"
              current={sort}
              dir={dir}
              onSort={toggleSort}
            />
            <SortButton
              label="Last Analyzed"
              sortKey="lastAnalyzed"
              current={sort}
              dir={dir}
              onSort={toggleSort}
            />
            <span className="text-xs text-[#606060]">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1f1f1f]">
            {sorted.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/projects/${project.id}/overview`}
                    className="truncate text-sm font-medium text-[#f0f0f0] hover:text-[#3b82f6]"
                  >
                    {project.name}
                  </Link>
                  {project.githubOwner && project.githubRepo && (
                    <p className="truncate text-xs text-[#606060]">
                      {project.githubOwner}/{project.githubRepo}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "text-sm font-medium",
                    project.latestScore != null ? scoreColor(project.latestScore) : "text-[#606060]"
                  )}
                >
                  {project.latestScore != null ? `${project.latestScore}/100` : "—"}
                </span>

                <span className="text-xs text-[#606060]">
                  {project.lastAnalyzedAt
                    ? new Date(project.lastAnalyzedAt).toLocaleDateString()
                    : "Never"}
                </span>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/projects/${project.id}/overview`}
                    className="rounded-md p-1.5 text-[#606060] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                    title="View report"
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/projects/${project.id}/analysis`}
                    className="rounded-md p-1.5 text-[#606060] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                    title="Analyze"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SortButton({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-xs transition-colors",
        isActive ? "text-[#f0f0f0]" : "text-[#606060] hover:text-[#a0a0a0]"
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}
