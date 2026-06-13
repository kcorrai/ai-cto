"use client";

import { useState } from "react";
import { Clock, Save, Loader2, CheckCircle, Trash2 } from "lucide-react";

type RetentionPolicy = {
  analysisMonths: number;
  auditLogMonths: number;
  deleteRepoContentAfterAnalysis: boolean;
};

type Props = {
  plan: string;
  initial: RetentionPolicy;
};

const MONTH_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "1 year" },
  { value: 24, label: "2 years" },
  { value: 36, label: "3 years" },
  { value: 60, label: "5 years" },
  { value: 84, label: "7 years" },
];

export function RetentionSettings({ plan, initial }: Props) {
  const [policy, setPolicy] = useState<RetentionPolicy>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isEnterprise = plan === "enterprise";

  async function save() {
    setSaving(true);
    const res = await fetch("/api/orgs/retention", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (!isEnterprise) return null;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]">
          <Clock className="h-4 w-4 text-[#3b82f6]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#f0f0f0]">Data Retention Policies</h3>
          <p className="mt-1 text-xs text-[#606060]">
            Configure how long data is retained. Applies automatically via nightly cleanup. GDPR
            Article 17 compliant.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Analysis retention */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#d0d0d0]">Analysis Results</p>
            <p className="mt-0.5 text-xs text-[#606060]">How long analysis reports are retained</p>
          </div>
          <select
            value={policy.analysisMonths}
            onChange={(e) => setPolicy((p) => ({ ...p, analysisMonths: parseInt(e.target.value) }))}
            className="rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audit log retention */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#d0d0d0]">Audit Logs</p>
            <p className="mt-0.5 text-xs text-[#606060]">
              How long security audit events are retained
            </p>
          </div>
          <select
            value={policy.auditLogMonths}
            onChange={(e) => setPolicy((p) => ({ ...p, auditLogMonths: parseInt(e.target.value) }))}
            className="rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Repo content deletion */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#d0d0d0]">Repository Content</p>
            <p className="mt-0.5 text-xs text-[#606060]">
              Delete cached repository files immediately after analysis completes
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={policy.deleteRepoContentAfterAnalysis}
              onChange={(e) =>
                setPolicy((p) => ({ ...p, deleteRepoContentAfterAnalysis: e.target.checked }))
              }
              className="sr-only"
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${policy.deleteRepoContentAfterAnalysis ? "bg-[#3b82f6]" : "bg-[#2a2a2a]"}`}
            >
              <div
                className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${policy.deleteRepoContentAfterAnalysis ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
          </label>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <Trash2 className="h-3.5 w-3.5 shrink-0 text-yellow-500 mt-0.5" />
          <p className="text-xs text-yellow-600">
            Retention policies trigger irreversible deletion. Data beyond the configured period is
            permanently removed each night.
          </p>
        </div>

        <div className="pt-1">
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-all"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {saved ? "Saved" : "Save Retention Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
