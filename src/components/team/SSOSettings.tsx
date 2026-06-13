"use client";

import { useState } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Lock,
} from "lucide-react";

type SamlConnection = {
  id: string;
  name: string;
  domain: string;
  provider: string;
  active: boolean;
  acsUrl: string;
  spEntityId: string;
  spMetadataUrl: string;
  idpMetadataUrl?: string;
};

type Props = {
  plan: string;
  initialConnections: SamlConnection[];
};

const PROVIDERS = [
  { value: "saml_okta", label: "Okta" },
  { value: "saml_azure_ad", label: "Microsoft Azure AD" },
  { value: "saml_google", label: "Google Workspace" },
  { value: "saml_custom", label: "Custom SAML 2.0" },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={() => void copy()}
      className="ml-2 rounded p-1 text-[#606060] transition-colors hover:text-[#a0a0a0]"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ConnectionCard({
  conn,
  onDelete,
  onToggle,
}: {
  conn: SamlConnection;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete SSO connection "${conn.name}"? This will immediately disable SSO for this domain.`
      )
    )
      return;
    setDeleting(true);
    const res = await fetch(`/api/orgs/sso/${conn.id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(conn.id);
    } else {
      setDeleting(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    const res = await fetch(`/api/orgs/sso/${conn.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !conn.active }),
    });
    if (res.ok) {
      const data = (await res.json()) as { connection: SamlConnection };
      onToggle(conn.id, data.connection.active);
    }
    setToggling(false);
  }

  const providerLabel = PROVIDERS.find((p) => p.value === conn.provider)?.label ?? conn.provider;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a]">
          <Shield className="h-4 w-4 text-[#3b82f6]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#f0f0f0] truncate">{conn.name}</p>
          <p className="text-xs text-[#606060]">
            {providerLabel} · {conn.domain}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              conn.active ? "bg-green-500/10 text-green-400" : "bg-[#1a1a1a] text-[#606060]"
            }`}
          >
            {conn.active ? "Active" : "Inactive"}
          </span>
          <button
            onClick={() => void handleToggle()}
            disabled={toggling}
            className="text-xs text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : conn.active ? (
              "Disable"
            ) : (
              "Enable"
            )}
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="text-[#606060] hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Delete connection"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[#606060] hover:text-[#a0a0a0] transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#1f1f1f] bg-[#0d0d0d] px-4 py-4 space-y-3">
          <p className="text-xs font-medium text-[#606060] uppercase tracking-wider mb-2">
            Service Provider Metadata (configure in your IdP)
          </p>
          <MetadataRow label="ACS URL" value={conn.acsUrl} />
          <MetadataRow label="SP Entity ID" value={conn.spEntityId} />
          {conn.spMetadataUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#606060] w-24 shrink-0">Metadata URL</span>
              <a
                href={conn.spMetadataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#3b82f6] hover:underline"
              >
                View XML <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {conn.idpMetadataUrl && (
            <MetadataRow label="IdP Metadata URL" value={conn.idpMetadataUrl} />
          )}
        </div>
      )}
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-[#606060] w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <code className="text-xs text-[#a0a0a0] font-mono break-all">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function SSOSettings({ plan, initialConnections }: Props) {
  const [connections, setConnections] = useState<SamlConnection[]>(initialConnections);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    domain: "",
    provider: "saml_okta",
    idpMetadataUrl: "",
  });

  const isEnterprise = plan === "enterprise";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/orgs/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = (await res.json()) as { connection: SamlConnection };
      setConnections((prev) => [...prev, data.connection]);
      setShowForm(false);
      setForm({ name: "", domain: "", provider: "saml_okta", idpMetadataUrl: "" });
    }
    setSaving(false);
  }

  function handleDelete(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  function handleToggle(id: string, active: boolean) {
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
  }

  if (!isEnterprise) {
    return (
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-8 text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f]">
          <Lock className="h-5 w-5 text-[#3b82f6]" />
        </div>
        <h3 className="mb-2 text-sm font-semibold text-[#f0f0f0]">Enterprise Plan Required</h3>
        <p className="mb-4 text-xs text-[#606060]">
          SAML SSO is available on the Enterprise plan. Upgrade to enable Okta, Azure AD, Google
          Workspace, and custom SAML 2.0 providers.
        </p>
        <a
          href="mailto:enterprise@aicto.dev"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] transition-colors"
        >
          Contact Sales
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Info card */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]">
            <Shield className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f0f0f0]">SAML 2.0 / OIDC Single Sign-On</h3>
            <p className="mt-1 text-xs text-[#606060]">
              Connect your identity provider so members can sign in with their corporate
              credentials. Just-in-time provisioning automatically adds new employees to your
              organization on first login.
            </p>
          </div>
        </div>
      </div>

      {/* Connections list */}
      {connections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#606060]">
            Configured Connections
          </h3>
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Add connection */}
      {showForm ? (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
          <h3 className="mb-4 text-sm font-medium text-[#f0f0f0]">New SSO Connection</h3>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-[#a0a0a0]">Connection Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Okta Production"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#a0a0a0]">Email Domain</label>
              <input
                required
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                placeholder="company.com"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[#606060]">
                Users with this email domain will be redirected to your IdP.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#a0a0a0]">Identity Provider</label>
              <select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#a0a0a0]">
                IdP Metadata URL <span className="text-[#606060]">(recommended)</span>
              </label>
              <input
                value={form.idpMetadataUrl}
                onChange={(e) => setForm((f) => ({ ...f, idpMetadataUrl: e.target.value }))}
                placeholder="https://your-idp.com/app/metadata.xml"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[#606060]">
                After creating the connection, you will receive an ACS URL and Entity ID to enter in
                your IdP.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-opacity"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Connection
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a2a] px-4 py-3 text-sm text-[#606060] hover:border-[#3b82f6]/50 hover:text-[#a0a0a0] transition-colors w-full"
        >
          <Plus className="h-4 w-4" />
          Add SSO Connection
        </button>
      )}

      {/* JIT provisioning info */}
      <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3">
        <p className="text-xs text-[#606060]">
          <span className="font-medium text-[#a0a0a0]">Just-in-time provisioning:</span> New
          employees who authenticate via SSO are automatically added to your organization. No
          invitation required. SSO enforcement is applied at the domain level — users with the
          configured domain must authenticate via your IdP.
        </p>
      </div>
    </div>
  );
}
