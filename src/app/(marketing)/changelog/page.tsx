import type { Metadata } from "next";
import { CHANGELOG } from "@/lib/changelog";
import { env } from "@/env";

export const metadata: Metadata = {
  title: "Changelog — AI CTO",
  description: "New features, improvements, and bug fixes in AI CTO.",
  alternates: {
    types: {
      "application/rss+xml": `${env.NEXT_PUBLIC_APP_URL}/api/changelog/feed.xml`,
    },
  },
};

const CATEGORY_STYLES = {
  feature: { label: "Feature", color: "#3b82f6", bg: "#3b82f618" },
  improvement: { label: "Improvement", color: "#22c55e", bg: "#22c55e18" },
  fix: { label: "Fix", color: "#f59e0b", bg: "#f59e0b18" },
} as const;

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ChangelogPage() {
  const grouped = CHANGELOG.reduce<Record<string, typeof CHANGELOG>>((acc, entry) => {
    const key = entry.date.slice(0, 7); // "2026-06"
    acc[key] = [...(acc[key] ?? []), entry];
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#3b82f6]">
            Product Updates
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#f0f0f0]">Changelog</h1>
          <p className="mt-3 text-base text-[#a0a0a0]">
            New features, improvements, and fixes — latest first.
          </p>
          <a
            href="/api/changelog/feed.xml"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#f59e0b] hover:underline"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
            </svg>
            RSS Feed
          </a>
        </div>

        {/* Entries */}
        <div className="space-y-12">
          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([monthKey, entries]) => (
              <div key={monthKey}>
                <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#606060]">
                  {new Date(`${monthKey}-01`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="space-y-6">
                  {entries.map((entry) => {
                    const style = CATEGORY_STYLES[entry.category];
                    return (
                      <div key={`${entry.date}-${entry.title}`} className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-[#3a3a3a] ring-2 ring-[#1a1a1a]" />
                          <div className="mt-1 flex-1 border-l border-[#2a2a2a]" />
                        </div>
                        <div className="min-w-0 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                              style={{ color: style.color, backgroundColor: style.bg }}
                            >
                              {style.label}
                            </span>
                            <time className="text-xs text-[#606060]">{fmt(entry.date)}</time>
                          </div>
                          <h3 className="mt-1.5 font-medium text-[#f0f0f0]">{entry.title}</h3>
                          <p className="mt-1 text-sm text-[#a0a0a0]">{entry.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
