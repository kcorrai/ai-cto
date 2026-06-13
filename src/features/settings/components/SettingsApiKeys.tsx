"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Trash2, Plus, AlertTriangle, Key } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type NewKey = ApiKey & { rawKey: string };

const EXPIRY_OPTIONS = [
  { label: "No expiry", value: null },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

const MAX_KEYS = 5;

function fmt(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SettingsApiKeys({ initialKeys, isPro }: { initialKeys: ApiKey[]; isPro: boolean }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<NewKey | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "write">("read");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);

  function copyKey(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scopes: [scope], expiresInDays }),
      });
      const data = (await res.json()) as NewKey & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create key");
        return;
      }
      setKeys((prev) => [data, ...prev]);
      setNewKey(data);
      setShowCreate(false);
      setName("");
      setScope("read");
      setExpiresInDays(null);
    });
  }

  function handleRevoke() {
    if (!revokeId) return;
    startTransition(async () => {
      const res = await fetch(`/api/keys/${revokeId}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== revokeId));
        if (newKey?.id === revokeId) setNewKey(null);
      }
      setRevokeId(null);
    });
  }

  if (!isPro) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3">
        <Key className="h-4 w-4 flex-shrink-0 text-[#606060]" />
        <div className="min-w-0">
          <p className="text-sm text-[#a0a0a0]">API keys are available on Pro and higher plans.</p>
        </div>
        <a
          href="/pricing"
          className="ml-auto flex-shrink-0 rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2563eb]"
        >
          Upgrade
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New key banner */}
      {newKey && (
        <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
            <p className="text-sm font-medium text-[#f59e0b]">
              Copy your API key now — it won&apos;t be shown again.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-[#0a0a0a] px-3 py-2">
            <code className="flex-1 select-all break-all text-xs text-[#22c55e]">
              {newKey.rawKey}
            </code>
            <button
              onClick={() => copyKey(newKey.rawKey)}
              className="flex-shrink-0 text-[#606060] hover:text-[#a0a0a0]"
            >
              {copied ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-[#606060] hover:text-[#a0a0a0]"
          >
            I&apos;ve saved the key
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Key name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI integration"
              required
              maxLength={255}
              className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#3a3a3a] outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "read" | "write")}
                className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
              >
                <option value="read">Read only</option>
                <option value="write">Read &amp; write</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Expiry</label>
              <select
                value={expiresInDays ?? ""}
                onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
              >
                {EXPIRY_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value ?? ""}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-[#ef4444]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded-md bg-[#3b82f6] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create key"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setError("");
              }}
              className="rounded-md border border-[#2a2a2a] px-4 py-1.5 text-xs text-[#a0a0a0] hover:text-[#f0f0f0]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Key list */}
      {keys.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-[#2a2a2a] py-8 text-center">
          <Key className="mx-auto mb-2 h-8 w-8 text-[#3a3a3a]" />
          <p className="text-sm text-[#606060]">No API keys yet.</p>
        </div>
      ) : (
        keys.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-[#2a2a2a]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#0f0f0f]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060]">
                    Name
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060] sm:table-cell">
                    Prefix
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060] md:table-cell">
                    Last used
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-[#606060] md:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {keys.map((k) => (
                  <tr key={k.id} className="bg-[#0a0a0a]">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#f0f0f0]">{k.name}</p>
                      <p className="text-[10px] text-[#606060]">
                        {k.scopes.join(", ")}
                        {k.expiresAt && ` · expires ${fmt(k.expiresAt)}`}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <code className="text-xs text-[#606060]">{k.keyPrefix}…</code>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs text-[#606060]">{fmt(k.lastUsedAt)}</span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs text-[#606060]">{fmt(k.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {revokeId === k.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-[#a0a0a0]">Revoke?</span>
                          <button
                            onClick={handleRevoke}
                            disabled={isPending}
                            className="text-xs text-[#ef4444] hover:underline disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setRevokeId(null)}
                            className="text-xs text-[#606060] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevokeId(k.id)}
                          className="text-[#606060] transition-colors hover:text-[#ef4444]"
                          aria-label="Revoke key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add button */}
      {!showCreate && keys.length < MAX_KEYS && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md border border-[#2a2a2a] px-4 py-2 text-sm text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
        >
          <Plus className="h-4 w-4" />
          New API key
        </button>
      )}
      {keys.length >= MAX_KEYS && (
        <p className="text-xs text-[#606060]">
          Maximum of {MAX_KEYS} active keys reached. Revoke an existing key to create a new one.
        </p>
      )}
    </div>
  );
}
