"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Lock, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Repo, ReposResponse } from "@/app/api/github/repos/route";

function timeAgo(dateString: string): string {
  const secs = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-4 w-4 animate-pulse rounded bg-[#222222]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-48 animate-pulse rounded bg-[#222222]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[#1a1a1a]" />
      </div>
      <div className="h-3 w-16 animate-pulse rounded bg-[#1a1a1a]" />
    </div>
  );
}

function RepoRow({ repo, onSelect }: { repo: Repo; onSelect: (repo: Repo) => void }) {
  return (
    <button
      onClick={() => onSelect(repo)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1a1a1a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3b82f6]"
    >
      {repo.isPrivate ? (
        <Lock className="h-4 w-4 shrink-0 text-[#606060]" aria-hidden="true" />
      ) : (
        <Globe className="h-4 w-4 shrink-0 text-[#606060]" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[#f0f0f0]">{repo.name}</span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
              repo.isPrivate ? "border-[#2a2a2a] text-[#606060]" : "border-[#2a2a2a] text-[#606060]"
            )}
          >
            {repo.isPrivate ? "Private" : "Public"}
          </span>
        </div>
        {repo.language && <span className="text-xs text-[#606060]">{repo.language}</span>}
      </div>
      <span className="shrink-0 text-xs text-[#606060]">{timeAgo(repo.updatedAt)}</span>
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-4 py-2">
      <span className="text-[11px] font-medium uppercase tracking-widest text-[#606060]">
        {label}
      </span>
    </div>
  );
}

type Sort = "updated" | "name";

interface RepoBrowserProps {
  onSelect: (repo: Repo) => void;
}

export function RepoBrowser({ onSelect }: RepoBrowserProps) {
  const [data, setData] = useState<ReposResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ReposResponse>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    const q = query.toLowerCase();

    function filterAndSort(repos: Repo[]) {
      const f = q ? repos.filter((r) => r.name.toLowerCase().includes(q)) : repos;
      return sort === "name" ? [...f].sort((a, b) => a.name.localeCompare(b.name)) : f;
    }

    return {
      personal: filterAndSort(data.personal),
      orgs: data.orgs
        .map((o) => ({ ...o, repos: filterAndSort(o.repos) }))
        .filter((o) => o.repos.length > 0),
    };
  }, [data, query, sort]);

  const totalFiltered =
    (filtered?.personal.length ?? 0) +
    (filtered?.orgs.reduce((s, o) => s + o.repos.length, 0) ?? 0);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#606060]" />
          <input
            type="text"
            placeholder="Search repositories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] py-1.5 pl-8 pr-3 text-sm text-[#f0f0f0] placeholder-[#606060] outline-none focus:border-[#3b82f6]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-2.5 py-1.5 text-sm text-[#a0a0a0] outline-none focus:border-[#3b82f6]"
        >
          <option value="updated">Recently updated</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <RefreshCw className="h-8 w-8 text-[#606060]" />
            <p className="text-sm text-[#a0a0a0]">Could not load repositories.</p>
            <a href="/settings" className="text-sm text-[#3b82f6] hover:underline">
              Check GitHub connection →
            </a>
          </div>
        )}

        {!loading && !error && totalFiltered === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[#606060]">
              {query
                ? `No repositories matching "${query}"`
                : "No repositories found. Make sure GitHub is connected."}
            </p>
          </div>
        )}

        {filtered && totalFiltered > 0 && (
          <>
            {filtered.personal.length > 0 && (
              <div>
                <SectionHeader label="Personal" />
                {filtered.personal.map((repo) => (
                  <RepoRow key={repo.id} repo={repo} onSelect={onSelect} />
                ))}
              </div>
            )}
            {filtered.orgs.map((org) => (
              <div key={org.login}>
                <SectionHeader label={org.login} />
                {org.repos.map((repo) => (
                  <RepoRow key={repo.id} repo={repo} onSelect={onSelect} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
