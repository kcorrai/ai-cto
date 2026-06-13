"use client";

import { useState } from "react";
import { Slack, Check, X, Loader2, ExternalLink } from "lucide-react";

type SlackConfig = {
  analysis_complete: boolean;
  critical_finding: boolean;
  weekly_digest: boolean;
  findings_resolved: boolean;
};

type Props = {
  connected: boolean;
  channelName: string | null;
  config: SlackConfig | null;
};

const DEFAULT_CONFIG: SlackConfig = {
  analysis_complete: true,
  critical_finding: true,
  weekly_digest: false,
  findings_resolved: false,
};

const NOTIFICATION_LABELS: Record<keyof SlackConfig, string> = {
  analysis_complete: "Analysis completed",
  critical_finding: "Critical finding detected",
  weekly_digest: "Weekly digest summary",
  findings_resolved: "Findings resolved by team",
};

export function SlackSettings({ connected, channelName, config: initialConfig }: Props) {
  const [isConnected, setIsConnected] = useState(connected);
  const [channel, setChannel] = useState(channelName);
  const [config, setConfig] = useState<SlackConfig>(initialConfig ?? DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function disconnect() {
    if (!confirm("Disconnect Slack from this organization?")) return;
    setDisconnecting(true);
    const res = await fetch("/api/orgs/slack/disconnect", { method: "DELETE" });
    if (res.ok) {
      setIsConnected(false);
      setChannel(null);
    }
    setDisconnecting(false);
  }

  async function saveConfig() {
    setSaving(true);
    await fetch("/api/orgs/slack/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggle(key: keyof SlackConfig) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a154b]">
            <Slack className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f0f0f0]">Slack Integration</h3>
            <p className="text-xs text-[#606060]">Get notified in your Slack workspace</p>
          </div>
        </div>
        <a
          href="/api/orgs/slack/connect"
          className="inline-flex items-center gap-2 rounded-lg bg-[#4a154b] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Slack className="h-4 w-4" />
          Connect to Slack
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a154b]">
            <Slack className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f0f0f0]">Slack Integration</h3>
            <p className="text-xs text-[#606060]">Connected{channel ? ` · #${channel}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Check className="h-3 w-3" />
            Active
          </span>
          <button
            onClick={() => void disconnect()}
            disabled={disconnecting}
            className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#606060] transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            {disconnecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Disconnect
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-[#a0a0a0]">Notify me when:</p>
        {(Object.keys(config) as (keyof SlackConfig)[]).map((key) => (
          <label key={key} className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-[#c0c0c0]">{NOTIFICATION_LABELS[key]}</span>
            <button
              role="switch"
              aria-checked={config[key]}
              onClick={() => toggle(key)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                config[key] ? "bg-[#3b82f6]" : "bg-[#2a2a2a]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  config[key] ? "left-4" : "left-0.5"
                }`}
              />
            </button>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => void saveConfig()}
          disabled={saving || saved}
          className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saved ? "Saved" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
