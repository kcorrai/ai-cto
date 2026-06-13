"use client";

import { useState } from "react";
import { Globe, Palette, Zap, CheckCircle, Loader2, ExternalLink } from "lucide-react";

type Project = {
  id: string;
  name: string;
  githubOwner: string | null;
  githubRepo: string | null;
  latestScore: number | null;
  lastAnalyzedAt: string | null;
  ownerName: string | null;
};

type Props = {
  orgId: string;
  orgName: string;
  settings: Record<string, unknown>;
  projects: Project[];
};

type WLSettings = {
  whiteLabelEnabled?: boolean;
  customDomain?: string;
  branding?: {
    companyName?: string;
    primaryColor?: string;
    hideAttribution?: boolean;
  };
};

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function WhiteLabelAdminPanel({ orgId, orgName, settings, projects }: Props) {
  const initial = settings as WLSettings;
  const [enabled, setEnabled] = useState(initial.whiteLabelEnabled ?? false);
  const [customDomain, setCustomDomain] = useState(initial.customDomain ?? "");
  const [companyName, setCompanyName] = useState(initial.branding?.companyName ?? orgName);
  const [primaryColor, setPrimaryColor] = useState(initial.branding?.primaryColor ?? "#7c3aed");
  const [hideAttribution, setHideAttribution] = useState(
    initial.branding?.hideAttribution ?? false
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ triggered: number } | null>(null);

  async function save() {
    setSaving(true);
    await fetch(`/api/orgs/white-label?orgId=${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whiteLabelEnabled: enabled,
        customDomain: customDomain || null,
        branding: { companyName, primaryColor, hideAttribution },
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  async function runBulkAnalysis() {
    setBulkRunning(true);
    setBulkResult(null);
    const res = await fetch(`/api/orgs/bulk-analyze?orgId=${orgId}`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { triggered: number };
      setBulkResult(data);
    }
    setBulkRunning(false);
  }

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#f0f0f0]">{orgName}</h2>
          <p className="text-xs text-[#606060]">{projects.length} projects in portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void runBulkAnalysis()}
            disabled={bulkRunning || projects.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] px-3 py-1.5 text-xs text-[#818cf8] hover:bg-[#1e1e3a] disabled:opacity-50 transition-colors"
          >
            {bulkRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            {bulkRunning ? "Analyzing…" : "Analyze All"}
          </button>
          {bulkResult && (
            <span className="text-xs text-[#22c55e]">
              {bulkResult.triggered} analysis{bulkResult.triggered !== 1 ? "es" : ""} queued
            </span>
          )}
        </div>
      </div>

      {/* White-label config */}
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center gap-3">
          <Palette className="h-4 w-4 text-[#a78bfa]" />
          <h3 className="text-sm font-medium text-[#d0d0d0]">White-Label Configuration</h3>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#d0d0d0]">Enable White-Label</p>
            <p className="text-xs text-[#606060]">Apply custom branding to reports and exports</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${enabled ? "bg-[#7c3aed]" : "bg-[#2a2a2a]"}`}
            >
              <div
                className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
          </label>
        </div>

        {enabled && (
          <div className="space-y-4 pl-2 border-l border-[#2a2a2a]">
            {/* Custom domain */}
            <div>
              <label className="flex items-center gap-1 mb-1 text-xs font-medium text-[#d0d0d0]">
                <Globe className="h-3 w-3" />
                Custom Domain
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="cto.youragency.com"
                className="w-full max-w-sm rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#a78bfa] focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-[#404040]">
                Point this domain to our servers via CNAME: cname.ai-cto.dev
              </p>
            </div>

            {/* Company name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] focus:border-[#a78bfa] focus:outline-none"
              />
            </div>

            {/* Primary color */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-[#606060]">{primaryColor}</span>
              </div>
            </div>

            {/* Hide attribution */}
            <div className="flex items-center justify-between max-w-sm">
              <p className="text-xs text-[#d0d0d0]">Remove &quot;Powered by AI CTO&quot;</p>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={hideAttribution}
                  onChange={(e) => setHideAttribution(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`h-5 w-9 rounded-full transition-colors ${hideAttribution ? "bg-[#7c3aed]" : "bg-[#2a2a2a]"}`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hideAttribution ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
              </label>
            </div>
          </div>
        )}

        <button
          onClick={() => void save()}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-4 py-2 text-xs font-medium text-white hover:bg-[#6d28d9] disabled:opacity-60 transition-all"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <CheckCircle className="h-3 w-3" />
          ) : null}
          {saved ? "Saved" : "Save Configuration"}
        </button>
      </div>

      {/* Portfolio table */}
      {projects.length > 0 && (
        <div className="border-t border-[#1f1f1f]">
          <div className="px-6 py-3 text-xs font-medium text-[#606060] uppercase tracking-wide">
            Client Projects
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {projects.slice(0, 15).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-xs font-medium text-[#f0f0f0]">
                    {p.githubOwner}/{p.githubRepo ?? p.name}
                  </p>
                  {p.ownerName && <p className="text-[10px] text-[#606060]">{p.ownerName}</p>}
                </div>
                <div className="flex items-center gap-4">
                  {p.latestScore !== null && (
                    <span
                      className="text-sm font-semibold"
                      style={{ color: scoreColor(p.latestScore) }}
                    >
                      {p.latestScore}
                    </span>
                  )}
                  <a
                    href={`/projects/${p.id}/analysis`}
                    className="text-[#606060] hover:text-[#f0f0f0] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          {projects.length > 15 && (
            <div className="px-6 py-3 text-xs text-[#606060]">
              +{projects.length - 15} more projects
            </div>
          )}
        </div>
      )}
    </div>
  );
}
