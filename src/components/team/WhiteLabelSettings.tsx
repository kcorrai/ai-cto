"use client";

import { useState, useRef } from "react";
import { Palette, Upload, Save, Loader2, CheckCircle, X } from "lucide-react";

type Branding = {
  logoUrl?: string;
  companyName?: string;
  hideAttribution?: boolean;
};

type Props = {
  plan: string;
  initial: Branding;
  orgName: string;
};

export function WhiteLabelSettings({ plan, initial, orgName }: Props) {
  const [branding, setBranding] = useState<Branding>(initial);
  const [companyName, setCompanyName] = useState(initial.companyName ?? orgName);
  const [hideAttribution, setHideAttribution] = useState(initial.hideAttribution ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEnterprise = plan === "enterprise";

  async function uploadLogo(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("logo", file);
    const res = await fetch("/api/orgs/branding", { method: "PUT", body: form });
    if (res.ok) {
      const data = (await res.json()) as { branding: Branding };
      setBranding(data.branding);
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/orgs/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, hideAttribution }),
    });
    if (res.ok) {
      const data = (await res.json()) as { branding: Branding };
      setBranding(data.branding);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (!isEnterprise) return null;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2e1065]">
          <Palette className="h-4 w-4 text-[#a78bfa]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#f0f0f0]">White-Label Report Branding</h3>
          <p className="mt-1 text-xs text-[#606060]">
            Customize PDF reports and exports with your brand identity.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Logo */}
        <div>
          <p className="mb-2 text-xs font-medium text-[#d0d0d0]">Organization Logo</p>
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branding.logoUrl}
                  alt="Organization logo"
                  className="h-12 w-auto max-w-[160px] rounded-lg border border-[#2a2a2a] object-contain bg-[#0d0d0d] p-1"
                />
                <button
                  onClick={() =>
                    setBranding((b) => {
                      const { logoUrl: _l, ...rest } = b;
                      return rest;
                    })
                  }
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1f1f1f] border border-[#2a2a2a] text-[#606060] hover:text-[#f0f0f0]"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-12 w-24 items-center justify-center rounded-lg border border-dashed border-[#2a2a2a] bg-[#0d0d0d] text-[#404040]">
                <Palette className="h-5 w-5" />
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                ref={fileRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#a78bfa] hover:text-[#a78bfa] disabled:opacity-60 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {uploading ? "Uploading…" : "Upload Logo"}
              </button>
              <p className="mt-1 text-[10px] text-[#404040]">PNG, JPG, SVG · max 2MB</p>
            </div>
          </div>
        </div>

        {/* Company name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">
            Company Name in Reports
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={orgName}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#a78bfa] focus:outline-none max-w-sm"
          />
        </div>

        {/* Hide attribution */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#d0d0d0]">
              Remove &quot;Analyzed by AI CTO&quot;
            </p>
            <p className="mt-0.5 text-xs text-[#606060]">
              Hides AI CTO attribution from PDF exports and shared reports
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={hideAttribution}
              onChange={(e) => setHideAttribution(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${hideAttribution ? "bg-[#a78bfa]" : "bg-[#2a2a2a]"}`}
            >
              <div
                className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hideAttribution ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
          </label>
        </div>

        <div className="pt-1">
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-4 py-2 text-xs font-medium text-white hover:bg-[#6d28d9] disabled:opacity-60 transition-all"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {saved ? "Saved" : "Save Branding"}
          </button>
        </div>
      </div>
    </div>
  );
}
