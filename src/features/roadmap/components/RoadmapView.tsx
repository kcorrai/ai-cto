"use client";

import { useState } from "react";
import { Loader2, Download, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoadmapItem = {
  phase: "now" | "next" | "later";
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  effortDays: number;
  impact: "low" | "medium" | "high";
  category: string;
  findingRefs: string[];
  dependencies: string[];
  priority: number;
};

export type Roadmap = {
  summary: string;
  generatedAt: string;
  items: RoadmapItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  security: "bg-red-500/10 text-red-400 border-red-500/20",
  architecture: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  performance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  testing: "bg-green-500/10 text-green-400 border-green-500/20",
  ux: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  devops: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  infrastructure: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  growth: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const EFFORT_COLORS: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
};

const IMPACT_COLORS: Record<string, string> = {
  low: "text-[#606060]",
  medium: "text-[#a0a0a0]",
  high: "text-[#f0f0f0]",
};

const PHASE_CONFIG = {
  now: {
    label: "Now",
    subtitle: "This sprint",
    color: "text-[#3b82f6]",
    border: "border-[#3b82f6]/30",
  },
  next: {
    label: "Next",
    subtitle: "This month",
    color: "text-[#a0a0a0]",
    border: "border-[#2a2a2a]",
  },
  later: {
    label: "Later",
    subtitle: "Next quarter",
    color: "text-[#606060]",
    border: "border-[#2a2a2a]",
  },
};

function exportToMarkdown(roadmap: Roadmap, projectName: string): string {
  const lines: string[] = [
    `# Development Roadmap — ${projectName}`,
    "",
    `> ${roadmap.summary}`,
    "",
    `_Generated ${new Date(roadmap.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}_`,
    "",
  ];

  const phases: Array<"now" | "next" | "later"> = ["now", "next", "later"];
  for (const phase of phases) {
    const phaseItems = roadmap.items
      .filter((i) => i.phase === phase)
      .sort((a, b) => b.priority - a.priority);

    if (phaseItems.length === 0) continue;

    const config = PHASE_CONFIG[phase];
    lines.push(`## ${config.label} — ${config.subtitle}`, "");

    for (const item of phaseItems) {
      lines.push(`### ${item.title}`);
      lines.push("");
      lines.push(item.description);
      lines.push("");
      lines.push(
        `- **Category:** ${item.category}  `,
        `- **Effort:** ${item.effort} (~${item.effortDays}d)  `,
        `- **Impact:** ${item.impact}  `
      );
      if (item.findingRefs.length > 0) {
        lines.push(`- **Addresses:** ${item.findingRefs.join(", ")}  `);
      }
      if (item.dependencies.length > 0) {
        lines.push(`- **After:** ${item.dependencies.join(", ")}  `);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const [expanded, setExpanded] = useState(false);
  const categoryClass =
    CATEGORY_COLORS[item.category] ?? "bg-[#1a1a1a] text-[#a0a0a0] border-[#2a2a2a]";

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 text-left transition-colors hover:border-[#3a3a3a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#f0f0f0]">{item.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                categoryClass
              )}
            >
              {item.category}
            </span>
            <span className={cn("text-xs font-medium", EFFORT_COLORS[item.effort])}>
              ~{item.effortDays}d
            </span>
            <span className="text-xs text-[#606060]">·</span>
            <span className={cn("text-xs", IMPACT_COLORS[item.impact])}>{item.impact} impact</span>
          </div>
        </div>
        <ArrowRight
          className={cn(
            "mt-0.5 h-3.5 w-3.5 shrink-0 text-[#606060] transition-transform",
            expanded && "rotate-90"
          )}
        />
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-[#1f1f1f] pt-3">
          <p className="text-xs leading-relaxed text-[#a0a0a0]">{item.description}</p>
          {item.findingRefs.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                Addresses
              </p>
              <ul className="space-y-0.5">
                {item.findingRefs.map((ref, i) => (
                  <li key={i} className="text-xs text-[#606060]">
                    · {ref}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.dependencies.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#606060]">
                Depends on
              </p>
              <p className="text-xs text-[#606060]">{item.dependencies.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function PhaseColumn({ phase, items }: { phase: "now" | "next" | "later"; items: RoadmapItem[] }) {
  const config = PHASE_CONFIG[phase];
  const sorted = [...items].sort((a, b) => b.priority - a.priority);

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("border-b pb-2.5", config.border)}>
        <p className={cn("text-base font-semibold", config.color)}>{config.label}</p>
        <p className="text-xs text-[#606060]">{config.subtitle}</p>
        <p className="mt-1 text-xs text-[#606060]">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-2">
        {sorted.map((item, i) => (
          <RoadmapCard key={i} item={item} />
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-[#606060]">No items for this phase</p>
        )}
      </div>
    </div>
  );
}

interface RoadmapViewProps {
  analysisId: string;
  projectName: string;
  initialRoadmap: Roadmap | null;
  hasAnalysis: boolean;
}

export function RoadmapView({
  analysisId,
  projectName,
  initialRoadmap,
  hasAnalysis,
}: RoadmapViewProps) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(initialRoadmap);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/roadmap`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to generate roadmap");
      }
      const data = (await res.json()) as { roadmap: Roadmap };
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  }

  function handleExport() {
    if (!roadmap) return;
    const md = exportToMarkdown(roadmap, projectName);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadmap-${projectName.replace(/\//g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasAnalysis) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
        <p className="text-sm text-[#606060]">Run an analysis first to generate a roadmap.</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
        <p className="mb-2 text-sm font-medium text-[#f0f0f0]">No roadmap yet</p>
        <p className="mb-6 text-xs text-[#606060]">
          Generate a prioritized 3-month development roadmap based on your analysis findings.
        </p>
        {error && <p className="mb-4 text-xs text-red-400">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating roadmap…
            </>
          ) : (
            "Generate Roadmap"
          )}
        </button>
        <p className="mt-3 text-xs text-[#606060]">Uses Claude Opus — takes ~15 seconds</p>
      </div>
    );
  }

  const nowItems = roadmap.items.filter((i) => i.phase === "now");
  const nextItems = roadmap.items.filter((i) => i.phase === "next");
  const laterItems = roadmap.items.filter((i) => i.phase === "later");

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs leading-relaxed text-[#a0a0a0]">{roadmap.summary}</p>
          <p className="mt-1 text-[11px] text-[#606060]">
            Generated{" "}
            {new Date(roadmap.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#f0f0f0] hover:text-[#f0f0f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
          >
            <Download className="h-3.5 w-3.5" />
            Export .md
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            title="Regenerate roadmap"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#f0f0f0] hover:text-[#f0f0f0] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-xs text-red-400">{error}</p>}

      {/* 3-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PhaseColumn phase="now" items={nowItems} />
        <PhaseColumn phase="next" items={nextItems} />
        <PhaseColumn phase="later" items={laterItems} />
      </div>
    </div>
  );
}
