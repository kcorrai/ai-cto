"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, ExternalLink, ArrowRight, CheckCircle } from "lucide-react";

export type LeaderboardEntry = {
  id: string;
  name: string;
  githubOwner: string;
  githubRepo: string;
  githubUrl: string | null;
  language: string | null;
  framework: string | null;
  category: string | null;
  score: number;
  publicToken: string;
  analyzedAt: string | null;
  topFinding: { severity: string; title: string } | null;
};

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Needs work";
  return "Critical";
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

const LANGUAGES = ["All", "TypeScript", "JavaScript", "Python", "Go", "Ruby", "Rust", "Java"];
const CATEGORIES = ["All", "Dev Tools", "Analytics", "Auth", "CRM", "E-commerce", "Infra", "Other"];

export function LeaderboardClient({ entries }: { entries: LeaderboardEntry[] }) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("All");
  const [category, setCategory] = useState("All");
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      if (
        q &&
        !e.name.toLowerCase().includes(q) &&
        !`${e.githubOwner}/${e.githubRepo}`.toLowerCase().includes(q)
      )
        return false;
      if (language !== "All" && e.language?.toLowerCase() !== language.toLowerCase()) return false;
      if (category !== "All" && e.category?.toLowerCase() !== category.toLowerCase()) return false;
      return true;
    });
  }, [entries, search, language, category]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      try {
        const res = await fetch("/api/leaderboard/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubUrl: data.get("githubUrl"),
            submitterEmail: data.get("submitterEmail") || undefined,
            message: data.get("message") || undefined,
          }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          setSubmitError(body.error ?? "Submission failed. Please try again.");
        } else {
          setSubmitDone(true);
          form.reset();
        }
      } catch {
        setSubmitError("Network error. Please try again.");
      }
    });
  }

  const languages = LANGUAGES.filter(
    (l) => l === "All" || entries.some((e) => e.language?.toLowerCase() === l.toLowerCase())
  );
  const categories = CATEGORIES.filter(
    (c) => c === "All" || entries.some((e) => e.category?.toLowerCase() === c.toLowerCase())
  );

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#606060]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] py-2.5 pl-9 pr-4 text-sm text-[#f0f0f0] placeholder-[#606060] outline-none ring-0 focus:border-[#3b82f6] sm:max-w-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#606060]">Language:</span>
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                language === l
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#2a2a2a]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#606060]">Category:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === c
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#2a2a2a]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length !== entries.length && (
          <p className="text-xs text-[#606060]">
            Showing {filtered.length} of {entries.length} projects
          </p>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1f1f1f] py-16 text-center">
          <p className="text-sm text-[#606060]">No projects match your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1f1f1f]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#111111]">
                <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060]">
                  #
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060]">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060]">
                  Score
                </th>
                <th className="hidden px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060] sm:table-cell">
                  Language
                </th>
                <th className="hidden px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060] lg:table-cell">
                  Top Finding
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.map((entry, i) => {
                const color = scoreColor(entry.score);
                const label = scoreLabel(entry.score);
                return (
                  <tr
                    key={entry.id}
                    className="group bg-[#0a0a0a] transition-colors hover:bg-[#111111]"
                  >
                    <td className="px-4 py-4 text-sm tabular-nums text-[#606060]">{i + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#f0f0f0]">
                          {entry.githubOwner}/{entry.githubRepo}
                        </span>
                        {entry.githubUrl && (
                          <a
                            href={entry.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#606060] opacity-0 transition-opacity hover:text-[#a0a0a0] group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {entry.category && (
                        <p className="mt-0.5 text-xs text-[#606060]">{entry.category}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="text-lg font-semibold tabular-nums leading-none"
                          style={{ color }}
                        >
                          {entry.score}
                        </span>
                        <span className="text-xs text-[#606060]">/100</span>
                      </div>
                      <p
                        className="mt-0.5 text-[10px] font-medium uppercase tracking-wider"
                        style={{ color }}
                      >
                        {label}
                      </p>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      {entry.language ? (
                        <span className="rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-xs text-[#a0a0a0]">
                          {entry.language}
                        </span>
                      ) : (
                        <span className="text-xs text-[#3a3a3a]">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      {entry.topFinding ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: SEVERITY_COLOR[entry.topFinding.severity] }}
                          />
                          <span className="max-w-[240px] truncate text-xs text-[#a0a0a0]">
                            {entry.topFinding.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#3a3a3a]">No open issues</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/s/${entry.publicToken}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#3b82f6] hover:text-[#3b82f6]"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit section */}
      <div className="mt-16 border-t border-[#1f1f1f] pt-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-[#f0f0f0]">Submit your project</h2>
            <p className="mt-2 text-sm text-[#a0a0a0]">
              Is your open-source project not on the leaderboard? Submit it for analysis. We review
              all submissions and add qualifying projects within a few days.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                "Public GitHub repository",
                "Actively maintained (last commit within 6 months)",
                "SaaS or developer tool",
              ].map((req) => (
                <li key={req} className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#22c55e]" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
            {submitDone ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-8 w-8 text-[#22c55e]" />
                <p className="font-medium text-[#f0f0f0]">Submission received</p>
                <p className="text-xs text-[#606060]">
                  We&apos;ll review it and add it to the leaderboard within a few days.
                </p>
                <button
                  onClick={() => setSubmitDone(false)}
                  className="mt-2 text-xs text-[#3b82f6] hover:underline"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="githubUrl"
                    className="mb-1.5 block text-xs font-medium text-[#a0a0a0]"
                  >
                    GitHub URL <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    required
                    placeholder="https://github.com/owner/repo"
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#3a3a3a] outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="submitterEmail"
                    className="mb-1.5 block text-xs font-medium text-[#a0a0a0]"
                  >
                    Your email <span className="text-[#606060]">(optional)</span>
                  </label>
                  <input
                    id="submitterEmail"
                    name="submitterEmail"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#3a3a3a] outline-none focus:border-[#3b82f6]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-xs font-medium text-[#a0a0a0]"
                  >
                    Why should this be included? <span className="text-[#606060]">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="Brief description of the project..."
                    className="w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#3a3a3a] outline-none focus:border-[#3b82f6]"
                  />
                </div>
                {submitError && <p className="text-xs text-[#ef4444]">{submitError}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-[#3b82f6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit project"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
