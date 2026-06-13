"use client";

import { useState } from "react";
import { Server, Save, Loader2, CheckCircle, Trash2, AlertCircle } from "lucide-react";

type GHEState = {
  configured: boolean;
  baseUrl: string;
  connectedAs: string;
};

type Props = {
  plan: string;
  initial: GHEState;
};

export function GHESettings({ plan, initial }: Props) {
  const [state, setState] = useState<GHEState>(initial);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);

  const isEnterprise = plan === "enterprise";

  async function save() {
    setError("");
    setSaving(true);
    const res = await fetch("/api/orgs/ghe", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl, personalAccessToken: token }),
    });

    if (res.ok) {
      const data = (await res.json()) as { connectedAs?: string };
      setState({ configured: true, baseUrl, connectedAs: data.connectedAs ?? "" });
      setToken("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to connect");
    }
    setSaving(false);
  }

  async function disconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/orgs/ghe", { method: "DELETE" });
    if (res.ok) {
      setState({ configured: false, baseUrl: "", connectedAs: "" });
      setBaseUrl("");
      setToken("");
    }
    setDisconnecting(false);
  }

  if (!isEnterprise) return null;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a2e1a]">
          <Server className="h-4 w-4 text-[#4ade80]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#f0f0f0]">GitHub Enterprise Server</h3>
          <p className="mt-1 text-xs text-[#606060]">
            Connect to a self-hosted GitHub Enterprise Server instance via Personal Access Token.
          </p>
        </div>
      </div>

      {state.configured ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
            <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-green-400 font-medium">Connected</p>
              <p className="text-xs text-[#606060]">
                {state.baseUrl}
                {state.connectedAs && ` · @${state.connectedAs}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => void disconnect()}
            disabled={disconnecting}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:border-red-500/60 disabled:opacity-60 transition-colors"
          >
            {disconnecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">
              GitHub Enterprise Server URL
            </label>
            <input
              type="url"
              placeholder="https://github.yourdomain.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#4ade80] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">
              Personal Access Token
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#4ade80] focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-[#404040]">
              Required scopes: repo, read:user, read:org
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={() => void save()}
            disabled={saving || !baseUrl || !token}
            className="flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-xs font-medium text-white hover:bg-[#15803d] disabled:opacity-60 transition-all"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {saved ? "Connected!" : "Connect GHE"}
          </button>
        </div>
      )}
    </div>
  );
}
