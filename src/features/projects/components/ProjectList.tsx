"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

const STATUS_LABEL: Record<string, string> = {
  complete: "Ready",
  failed: "Failed",
  queued: "Queued",
  fetching: "Fetching",
  analyzing: "Analyzing",
  synthesizing: "Synthesizing",
};

export type ProjectRow = {
  id: string;
  name: string;
  githubOwner: string | null;
  githubRepo: string | null;
  tags: string[];
  analyses: { status: string; score: number | null }[];
};

interface Props {
  projects: ProjectRow[];
}

export function ProjectList({ projects }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag") ?? "";

  function setTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tag && tag !== activeTag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Collect all unique tags across projects
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort();

  const filtered = activeTag ? projects.filter((p) => p.tags.includes(activeTag)) : projects;

  if (projects.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <p className="text-[#606060]">No projects yet.</p>
        <Link
          href="/projects/new"
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb]"
        >
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTag("")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !activeTag
                ? "bg-[#3b82f6] text-white"
                : "bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#222222]"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTag === tag
                  ? "bg-[#1e3a5f] text-[#93c5fd]"
                  : "bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#222222]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#606060]">
            No projects tagged &ldquo;{activeTag}&rdquo;.
          </p>
        ) : (
          filtered.map((p) => {
            const latest = p.analyses[0];
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}/overview`}
                className="flex items-center justify-between rounded-lg border border-[#1f1f1f] bg-[#111111] px-5 py-4 transition-colors hover:border-[#2a2a2a] hover:bg-[#161616]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#f0f0f0]">{p.name}</p>
                  <p className="mt-0.5 text-xs text-[#606060]">
                    {p.githubOwner}/{p.githubRepo}
                  </p>
                  {p.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] font-medium text-[#93c5fd]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 shrink-0 text-right">
                  {latest?.score != null ? (
                    <span
                      className="text-2xl font-semibold tabular-nums"
                      style={{ color: scoreColor(latest.score) }}
                    >
                      {latest.score}
                    </span>
                  ) : latest?.status && latest.status !== "complete" ? (
                    <span className="text-xs text-[#3b82f6]">
                      {STATUS_LABEL[latest.status] ?? latest.status}
                    </span>
                  ) : (
                    <span className="text-xs text-[#404040]">No analysis</span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
