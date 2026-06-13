"use client";

import { useState } from "react";
import { RefreshCw, Trash2, Copy, Check, Loader2, UserCheck } from "lucide-react";

type Props = {
  plan: string;
  hasToken: boolean;
  appUrl: string;
};

export function ScimSettings({ plan, hasToken: initialHasToken, appUrl }: Props) {
  const [hasToken, setHasToken] = useState(initialHasToken);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const isEnterprise = plan === "enterprise";
  const scimBaseUrl = `${appUrl}/api/scim/v2`;

  async function generate() {
    setGenerating(true);
    const res = await fetch("/api/orgs/scim/token", { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { token: string };
      setNewToken(data.token);
      setHasToken(true);
    }
    setGenerating(false);
  }

  async function revoke() {
    if (!confirm("Revoke SCIM token? Your IdP will immediately lose provisioning access.")) return;
    setRevoking(true);
    const res = await fetch("/api/orgs/scim/token", { method: "DELETE" });
    if (res.ok) {
      setHasToken(false);
      setNewToken(null);
    }
    setRevoking(false);
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isEnterprise) return null;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]">
          <UserCheck className="h-4 w-4 text-[#3b82f6]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#f0f0f0]">SCIM 2.0 Provisioning</h3>
          <p className="mt-1 text-xs text-[#606060]">
            Automate user provisioning and deprovisioning via SCIM 2.0. Compatible with Okta, Azure
            AD, and OneLogin.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Base URL */}
        <div>
          <p className="mb-1 text-xs text-[#606060]">SCIM Base URL</p>
          <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2">
            <code className="flex-1 text-xs text-[#a0a0a0] font-mono break-all">{scimBaseUrl}</code>
            <button
              onClick={() => void copy(scimBaseUrl)}
              className="shrink-0 text-[#606060] hover:text-[#a0a0a0] transition-colors"
              aria-label="Copy SCIM base URL"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Bearer token */}
        <div>
          <p className="mb-1 text-xs text-[#606060]">Bearer Token</p>
          {newToken ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2">
                <code className="flex-1 text-xs text-green-400 font-mono break-all">
                  {newToken}
                </code>
                <button
                  onClick={() => void copy(newToken)}
                  className="shrink-0 text-[#606060] hover:text-[#a0a0a0] transition-colors"
                  aria-label="Copy token"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-yellow-500">
                Copy this token now — it will not be shown again.
              </p>
            </div>
          ) : hasToken ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2">
              <code className="flex-1 text-xs text-[#606060] font-mono">
                scim_••••••••••••••••••••••
              </code>
              <span className="text-xs text-green-400">Active</span>
            </div>
          ) : (
            <p className="text-xs text-[#606060]">No token generated yet.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => void generate()}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-opacity"
          >
            {generating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {hasToken ? "Regenerate Token" : "Generate Token"}
          </button>
          {hasToken && (
            <button
              onClick={() => void revoke()}
              disabled={revoking}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:border-red-500/60 disabled:opacity-60 transition-colors"
            >
              {revoking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
