"use client";

import { useState } from "react";
import { Webhook, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Copy, Check } from "lucide-react";

type WebhookRow = {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  _count: { deliveries: number };
};

const ALL_EVENTS = [
  { value: "analysis_complete", label: "Analysis completed" },
  { value: "critical_finding", label: "Critical finding detected" },
  { value: "findings_resolved", label: "Findings resolved" },
  { value: "member_joined", label: "Member joined" },
];

export function WebhookManager({ initial }: { initial: WebhookRow[] }) {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    events: ["analysis_complete", "critical_finding"],
  });
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setSaving(true);
    const res = await fetch("/api/orgs/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = (await res.json()) as { webhook: WebhookRow; secret: string };
      setWebhooks((prev) => [{ ...data.webhook, _count: { deliveries: 0 } }, ...prev]);
      setNewSecret(data.secret);
      setShowForm(false);
      setForm({ name: "", url: "", events: ["analysis_complete", "critical_finding"] });
    }
    setSaving(false);
  }

  async function toggle(id: string, enabled: boolean) {
    const res = await fetch(`/api/orgs/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, enabled } : w)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this webhook?")) return;
    const res = await fetch(`/api/orgs/webhooks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    }
  }

  function copySecret() {
    if (!newSecret) return;
    void navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleEvent(event: string) {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  }

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
            <Webhook className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f0f0f0]">Outbound Webhooks</h3>
            <p className="text-xs text-[#606060]">Push events to your own endpoints</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add webhook
        </button>
      </div>

      {/* Secret reveal after creation */}
      {newSecret && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
          <p className="mb-1 text-xs font-medium text-yellow-400">
            Save this signing secret — it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-[#1a1a1a] px-2 py-1 text-xs text-[#f0f0f0]">
              {newSecret}
            </code>
            <button onClick={copySecret} className="shrink-0 text-[#606060] hover:text-[#f0f0f0]">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-2 text-xs text-[#606060] hover:text-[#a0a0a0]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-4 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Name (e.g. My CI System)"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#606060] focus:border-[#3b82f6] focus:outline-none"
          />
          <input
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            placeholder="https://your-endpoint.com/webhook"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#606060] focus:border-[#3b82f6] focus:outline-none"
          />
          <div>
            <p className="mb-2 text-xs text-[#a0a0a0]">Events</p>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((ev) => (
                <label key={ev.value} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.events.includes(ev.value)}
                    onChange={() => toggleEvent(ev.value)}
                    className="h-3 w-3 accent-[#3b82f6]"
                  />
                  <span className="text-xs text-[#c0c0c0]">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-[#606060] hover:text-[#f0f0f0]"
            >
              Cancel
            </button>
            <button
              onClick={() => void create()}
              disabled={saving || !form.name || !form.url || form.events.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <p className="text-center text-sm text-[#606060] py-4">No webhooks yet.</p>
      ) : (
        <div className="divide-y divide-[#1f1f1f]">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-start justify-between py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#f0f0f0]">{wh.name}</p>
                <p className="mt-0.5 truncate text-xs text-[#606060]">{wh.url}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      className="rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] text-[#3b82f6]"
                    >
                      {ev.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-[#606060]">{wh._count.deliveries} deliveries</span>
                <button
                  onClick={() => void toggle(wh.id, !wh.enabled)}
                  className="text-[#606060] hover:text-[#f0f0f0]"
                  title={wh.enabled ? "Disable" : "Enable"}
                >
                  {wh.enabled ? (
                    <ToggleRight className="h-5 w-5 text-[#3b82f6]" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => void remove(wh.id)}
                  className="text-[#606060] hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
