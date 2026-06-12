"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CheckCircle, Copy } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";

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
};

async function resolveFinding(id: string): Promise<void> {
  const res = await fetch(`/api/findings/${id}/resolve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to resolve finding");
}

export function FindingCard({ finding }: { finding: FindingCardData }) {
  const [expanded, setExpanded] = useState(false);
  const [resolved, setResolved] = useState(finding.isResolved);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const borderColor = SEVERITY_BORDER[finding.severity] ?? "#71717a";
  const moduleName = MODULE_NAMES[finding.module] ?? finding.module;

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
      <button
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
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
        <span className="shrink-0 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#606060]">
          {moduleName}
        </span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-[#606060] transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

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
                <button
                  onClick={handleCopyPath}
                  className="group flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 transition-colors hover:border-[#404040]"
                  title="Copy file path"
                >
                  <code className="font-mono text-xs text-[#a0a0a0]">{finding.filePath}</code>
                  <Copy className="h-3 w-3 shrink-0 text-[#606060] opacity-0 transition-opacity group-hover:opacity-100" />
                  {copied && <span className="text-[10px] text-[#22c55e]">Copied</span>}
                </button>
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

              {!resolved && (
                <button
                  onClick={handleResolve}
                  disabled={isPending}
                  className="rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#22c55e]/40 hover:text-[#22c55e] disabled:opacity-50"
                >
                  Mark as resolved
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
