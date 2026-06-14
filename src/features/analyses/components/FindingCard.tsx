"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CheckCircle, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import { LinearPushButton, LinearBadge } from "./LinearPushButton";
import { JiraPushButton, JiraBadge } from "./JiraPushButton";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#71717a",
};

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

export type FindingCardData = {
  id: string;
  module: string;
  severity: string;
  title: string;
  description: string | null;
  recommendation: string | null;
  filePath: string | null;
  effort: string | null;
  impact: string | null;
  isResolved: boolean;
  metadata?: unknown;
};

export type FindingCardProps = {
  finding: FindingCardData;
  readonly?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  isLinearConnected?: boolean;
  isJiraConnected?: boolean;
};

async function resolveFinding(id: string): Promise<void> {
  const res = await fetch(`/api/findings/${id}/resolve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to resolve finding");
}

export function FindingCard({
  finding,
  readonly,
  selected,
  onToggleSelect,
  isLinearConnected = false,
  isJiraConnected = false,
}: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [resolved, setResolved] = useState(finding.isResolved);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackDone, setFeedbackDone] = useState(false);
  const meta = finding.metadata as
    | {
        codeSnippet?: string;
        linearIssueId?: string;
        linearIssueUrl?: string;
        linearIssueIdentifier?: string;
        jiraIssueKey?: string;
        jiraIssueUrl?: string;
      }
    | undefined;
  const linearIssueUrl = meta?.linearIssueUrl ?? null;
  const linearIdentifier = meta?.linearIssueIdentifier;
  const [jiraIssueKey, setJiraIssueKey] = useState(meta?.jiraIssueKey ?? null);
  const [jiraIssueUrl, setJiraIssueUrl] = useState(meta?.jiraIssueUrl ?? null);

  const borderColor = SEVERITY_BORDER[finding.severity] ?? "#71717a";
  const moduleName = MODULE_NAMES[finding.module] ?? finding.module;
  const codeSnippet = meta?.codeSnippet ?? null;

  function handleToggle() {
    setExpanded((e) => !e);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }

  function handleResolve() {
    setResolved(true); // optimistic
    startTransition(async () => {
      try {
        await resolveFinding(finding.id);
      } catch {
        setResolved(false); // rollback
      }
    });
  }

  async function submitFeedback(vote: "up" | "down", note?: string) {
    setFeedback(vote);
    try {
      await fetch(`/api/findings/${finding.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, ...(note ? { note } : {}) }),
      });
    } finally {
      setFeedbackDone(true);
    }
  }

  function handleCopyPath() {
    if (!finding.filePath) return;
    void navigator.clipboard.writeText(finding.filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111]"
      style={{ borderLeftColor: borderColor, borderLeftWidth: "3px" }}
    >
      {/* Header row — always visible */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {onToggleSelect && !readonly && (
          <button
            className="mt-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(finding.id);
            }}
            aria-label={selected ? "Deselect finding" : "Select finding"}
          >
            <div
              className={`h-4 w-4 rounded border transition-colors ${
                selected
                  ? "border-[#3b82f6] bg-[#3b82f6]"
                  : "border-[#404040] bg-transparent hover:border-[#606060]"
              }`}
            >
              {selected && (
                <svg viewBox="0 0 12 12" fill="none" className="h-4 w-4 p-0.5">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>
        )}
        <button
          className="flex flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] rounded"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={expanded}
        >
          <div className="mt-0.5 shrink-0">
            <SeverityBadge severity={finding.severity} />
          </div>
          <span className="min-w-0 flex-1 text-sm font-medium text-[#f0f0f0]">
            {finding.title}
            {resolved && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-normal text-[#22c55e]">
                <CheckCircle className="h-3 w-3" />
                Resolved
              </span>
            )}
          </span>
          <span className="hidden shrink-0 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#606060] sm:inline">
            {moduleName}
          </span>
          <ChevronDown
            className="mt-0.5 h-4 w-4 shrink-0 text-[#606060] transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>

      {/* Expanded body — animated */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4 pt-1">
              {finding.description && (
                <p className="text-sm leading-relaxed text-[#a0a0a0]">{finding.description}</p>
              )}

              {finding.recommendation && (
                <div className="rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-[#606060]">
                    Recommendation
                  </p>
                  <p className="text-sm leading-relaxed text-[#a0a0a0]">{finding.recommendation}</p>
                </div>
              )}

              {finding.filePath && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyPath}
                      className="group flex flex-1 items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 transition-colors hover:border-[#404040]"
                      title="Copy file path"
                    >
                      <code className="font-mono text-xs text-[#a0a0a0]">{finding.filePath}</code>
                      <Copy className="h-3 w-3 shrink-0 text-[#606060] opacity-0 transition-opacity group-hover:opacity-100" />
                      {copied && <span className="text-[10px] text-[#22c55e]">Copied</span>}
                    </button>
                    {codeSnippet && (
                      <button
                        onClick={() => setSnippetOpen((s) => !s)}
                        className="shrink-0 rounded border border-[#2a2a2a] px-2 py-1.5 text-[10px] text-[#606060] transition-colors hover:border-[#404040] hover:text-[#a0a0a0]"
                      >
                        {snippetOpen ? "Hide" : "View"} code
                      </button>
                    )}
                  </div>
                  {snippetOpen && codeSnippet && (
                    <div className="overflow-hidden rounded-md border border-[#2a2a2a] bg-[#060606]">
                      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-1.5">
                        <span className="font-mono text-[10px] text-[#505050]">
                          {finding.filePath}
                        </span>
                        <span className="text-[10px] text-[#404040]">first 60 lines</span>
                      </div>
                      <pre className="max-h-64 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-[#a0a0a0]">
                        <code>{codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {(finding.effort || finding.impact) && (
                <div className="flex gap-4 text-xs text-[#606060]">
                  {finding.effort && (
                    <span>
                      Effort: <span className="capitalize text-[#a0a0a0]">{finding.effort}</span>
                    </span>
                  )}
                  {finding.impact && (
                    <span>
                      Impact: <span className="capitalize text-[#a0a0a0]">{finding.impact}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {!readonly && !resolved && (
                  <button
                    onClick={handleResolve}
                    disabled={isPending}
                    className="rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#22c55e]/40 hover:text-[#22c55e] disabled:opacity-50"
                  >
                    Mark as resolved
                  </button>
                )}
                {!readonly &&
                  (linearIssueUrl ? (
                    <LinearBadge
                      issueUrl={linearIssueUrl}
                      {...(linearIdentifier ? { identifier: linearIdentifier } : {})}
                    />
                  ) : (
                    <LinearPushButton
                      findingIds={[finding.id]}
                      isLinearConnected={isLinearConnected}
                    />
                  ))}
                {!readonly &&
                  (jiraIssueKey && jiraIssueUrl ? (
                    <JiraBadge issueKey={jiraIssueKey} issueUrl={jiraIssueUrl} />
                  ) : (
                    <JiraPushButton
                      findingId={finding.id}
                      isJiraConnected={isJiraConnected}
                      onPushed={(key, url) => {
                        setJiraIssueKey(key);
                        setJiraIssueUrl(url);
                      }}
                    />
                  ))}
              </div>

              {/* Feedback */}
              <div className="border-t border-[#1a1a1a] pt-3">
                {feedbackDone ? (
                  <p className="text-xs text-[#606060]">Thanks for your feedback.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#505050]">Was this helpful?</span>
                      <button
                        onClick={() => void submitFeedback("up")}
                        className={`rounded p-1 transition-colors ${feedback === "up" ? "text-[#22c55e]" : "text-[#505050] hover:text-[#a0a0a0]"}`}
                        aria-label="Helpful"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setFeedback(feedback === "down" ? null : "down")}
                        className={`rounded p-1 transition-colors ${feedback === "down" ? "text-[#f97316]" : "text-[#505050] hover:text-[#a0a0a0]"}`}
                        aria-label="Not helpful"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {feedback === "down" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feedbackNote}
                          onChange={(e) => setFeedbackNote(e.target.value)}
                          placeholder="False positive? Add a note… (optional)"
                          maxLength={500}
                          className="flex-1 rounded border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-1 text-xs text-[#a0a0a0] placeholder-[#404040] outline-none focus:border-[#404040]"
                        />
                        <button
                          onClick={() => void submitFeedback("down", feedbackNote || undefined)}
                          className="rounded border border-[#2a2a2a] px-2 py-1 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
