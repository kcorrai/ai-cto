import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Shield, Check, AlertTriangle, Lock, FileText, Server, Users, Key } from "lucide-react";
import { AuditAction } from "@/lib/audit";

const REQUIRED_AUDIT_ACTIONS = [
  { action: AuditAction.USER_LOGIN, label: "User sign-in" },
  { action: AuditAction.PROJECT_CREATED, label: "Project creation" },
  { action: AuditAction.PROJECT_DELETED, label: "Project deletion" },
  { action: AuditAction.PROJECT_ANALYZED, label: "Analysis triggered" },
  { action: AuditAction.MEMBER_INVITED, label: "Member invited" },
  { action: AuditAction.MEMBER_REMOVED, label: "Member removed" },
  { action: AuditAction.MEMBER_ROLE_CHANGED, label: "Role change" },
  { action: AuditAction.API_KEY_CREATED, label: "API key created" },
  { action: AuditAction.API_KEY_DELETED, label: "API key deleted" },
  { action: AuditAction.SUBSCRIPTION_CHANGED, label: "Billing changes" },
  { action: AuditAction.ORG_SETTINGS_UPDATED, label: "Settings changes" },
  { action: AuditAction.SSO_CONNECTION_CREATED, label: "SSO configuration" },
  { action: AuditAction.SCIM_USER_PROVISIONED, label: "SCIM provisioning" },
  { action: AuditAction.REPORT_EXPORTED, label: "Report exported" },
];

const ENCRYPTION_INVENTORY = [
  { item: "Data in transit", method: "TLS 1.2+", status: "enforced" },
  { item: "Database (Neon PostgreSQL)", method: "AES-256 at rest", status: "enforced" },
  { item: "GitHub/GitLab tokens", method: "AES-256-GCM (app-level)", status: "enforced" },
  { item: "SCIM bearer tokens", method: "SHA-256 hash", status: "enforced" },
  { item: "API keys", method: "SHA-256 hash", status: "enforced" },
  { item: "Session tokens", method: "Clerk-managed", status: "enforced" },
];

const POLICY_CHECKLIST = [
  { id: "audit-logs", label: "Audit logging", note: "All sensitive actions logged", done: true },
  {
    id: "rbac",
    label: "Role-based access control",
    note: "Owner / Admin / Editor / Viewer",
    done: true,
  },
  { id: "sso", label: "SSO / SAML 2.0", note: "Clerk Enterprise Connections", done: true },
  {
    id: "scim",
    label: "SCIM 2.0 provisioning",
    note: "Auto user lifecycle management",
    done: true,
  },
  {
    id: "encryption",
    label: "Encryption at rest & in transit",
    note: "AES-256 + TLS 1.2+",
    done: true,
  },
  {
    id: "retention",
    label: "Data retention policies",
    note: "Configurable, GDPR Article 17",
    done: true,
  },
  {
    id: "pentest",
    label: "Annual penetration test",
    note: "Engage external security firm",
    done: false,
  },
  {
    id: "vuln-disclosure",
    label: "Vulnerability disclosure policy",
    note: "security.txt + contact",
    done: false,
  },
  {
    id: "incident-response",
    label: "Incident response plan",
    note: "Written & tested",
    done: false,
  },
  {
    id: "vendor-dpas",
    label: "Vendor DPAs",
    note: "Neon, Clerk, Stripe, Anthropic, Vercel",
    done: false,
  },
  {
    id: "security-training",
    label: "Annual security training",
    note: "Employee security awareness",
    done: false,
  },
  {
    id: "background-checks",
    label: "Background check policy",
    note: "For employees with data access",
    done: false,
  },
];

export default async function SOC2Page() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) redirect("/team");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, plan: true },
  });
  if (!org) redirect("/team");

  if (org.plan !== "enterprise") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] mb-4">
          <Shield className="h-6 w-6 text-[#404040]" />
        </div>
        <h2 className="text-base font-medium text-[#f0f0f0] mb-2">Enterprise Feature</h2>
        <p className="text-sm text-[#606060] max-w-xs">
          SOC 2 compliance tooling is available on the Enterprise plan.
        </p>
      </div>
    );
  }

  // Audit log coverage: which required actions have been logged at least once
  const loggedActions = await db.auditLog.findMany({
    where: { organizationId: org.id },
    select: { action: true },
    distinct: ["action"],
  });
  const loggedSet = new Set(loggedActions.map((l) => l.action));

  const doneCount = POLICY_CHECKLIST.filter((p) => p.done).length;
  const totalCount = POLICY_CHECKLIST.length;
  const auditCoverage = REQUIRED_AUDIT_ACTIONS.filter((a) => loggedSet.has(a.action)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#f0f0f0]">SOC 2 Compliance</h1>
        <p className="mt-1 text-sm text-[#606060]">Readiness checklist and security controls</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-3.5 w-3.5 text-[#606060]" />
            <span className="text-xs text-[#606060]">Policy Completion</span>
          </div>
          <p className="text-2xl font-semibold text-[#f0f0f0]">
            {doneCount}/{totalCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-[#606060]" />
            <span className="text-xs text-[#606060]">Audit Coverage</span>
          </div>
          <p className="text-2xl font-semibold text-[#f0f0f0]">
            {auditCoverage}/{REQUIRED_AUDIT_ACTIONS.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-3.5 w-3.5 text-[#606060]" />
            <span className="text-xs text-[#606060]">Encryption Controls</span>
          </div>
          <p className="text-2xl font-semibold text-[#f0f0f0]">{ENCRYPTION_INVENTORY.length}/6</p>
        </div>
      </div>

      {/* Policy checklist */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#3b82f6]" />
          <h3 className="text-xs font-medium text-[#d0d0d0]">SOC 2 Controls Checklist</h3>
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {POLICY_CHECKLIST.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.done ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] border border-[#2a2a2a]">
                  <AlertTriangle className="h-3 w-3 text-yellow-400/70" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-[#d0d0d0]">{item.label}</p>
                <p className="text-xs text-[#606060]">{item.note}</p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  item.done ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {item.done ? "Complete" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit log coverage */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-[#3b82f6]" />
          <h3 className="text-xs font-medium text-[#d0d0d0]">Audit Log Coverage</h3>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-[#1a1a1a]">
          {REQUIRED_AUDIT_ACTIONS.map((item) => {
            const covered = loggedSet.has(item.action);
            return (
              <div key={item.action} className="flex items-center gap-2 px-4 py-2.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${covered ? "bg-green-400" : "bg-[#404040]"}`}
                />
                <span className="text-xs text-[#a0a0a0]">{item.label}</span>
                {!covered && (
                  <span className="text-[10px] text-[#404040] ml-auto">no events yet</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Encryption inventory */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[#3b82f6]" />
          <h3 className="text-xs font-medium text-[#d0d0d0]">Encryption Inventory</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="px-4 py-2 text-left font-medium text-[#606060]">Data / System</th>
              <th className="px-4 py-2 text-left font-medium text-[#606060]">Method</th>
              <th className="px-4 py-2 text-left font-medium text-[#606060]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {ENCRYPTION_INVENTORY.map((item) => (
              <tr key={item.item} className="hover:bg-[#141414]">
                <td className="px-4 py-2.5 text-[#d0d0d0]">{item.item}</td>
                <td className="px-4 py-2.5 text-[#a0a0a0] font-mono">{item.method}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 text-green-400">
                    <Check className="h-3 w-3" />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Access control summary */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-[#3b82f6]" />
          <h3 className="text-xs font-medium text-[#d0d0d0]">Access Control — Role Permissions</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="px-4 py-2 text-left font-medium text-[#606060]">Permission</th>
              <th className="px-4 py-2 text-center font-medium text-[#606060]">Owner</th>
              <th className="px-4 py-2 text-center font-medium text-[#606060]">Admin</th>
              <th className="px-4 py-2 text-center font-medium text-[#606060]">Editor</th>
              <th className="px-4 py-2 text-center font-medium text-[#606060]">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {[
              ["View projects & analyses", true, true, true, true],
              ["Trigger analysis", true, true, true, false],
              ["Manage members", true, true, false, false],
              ["Billing management", true, true, false, false],
              ["SSO configuration", true, true, false, false],
              ["SCIM management", true, true, false, false],
              ["API key management", true, true, true, false],
              ["Audit log access", true, true, false, false],
              ["Delete organization", true, false, false, false],
            ].map(([perm, owner, admin, editor, viewer]) => (
              <tr key={String(perm)} className="hover:bg-[#141414]">
                <td className="px-4 py-2.5 text-[#a0a0a0]">{String(perm)}</td>
                {[owner, admin, editor, viewer].map((allowed, i) => (
                  <td key={i} className="px-4 py-2.5 text-center">
                    {allowed ? (
                      <Check className="inline h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <span className="text-[#2a2a2a]">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Infrastructure */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-3.5 w-3.5 text-[#3b82f6]" />
          <h3 className="text-xs font-medium text-[#d0d0d0]">Vendor & Sub-processor Inventory</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { vendor: "Vercel", purpose: "Hosting & compute", region: "US/EU" },
            { vendor: "Neon", purpose: "PostgreSQL database", region: "US-East-1" },
            { vendor: "Clerk", purpose: "Authentication & SSO", region: "US" },
            { vendor: "Stripe", purpose: "Payment processing", region: "US" },
            { vendor: "Anthropic", purpose: "AI analysis (Claude)", region: "US" },
            { vendor: "Upstash", purpose: "Redis (rate limiting)", region: "US-East-1" },
            { vendor: "Vercel Blob", purpose: "File storage", region: "US" },
            { vendor: "Resend", purpose: "Transactional email", region: "US" },
          ].map((v) => (
            <div key={v.vendor} className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#d0d0d0]">{v.vendor}</span>
                <Key className="h-3 w-3 text-[#404040]" />
              </div>
              <p className="mt-0.5 text-[#606060]">{v.purpose}</p>
              <p className="text-[10px] text-[#404040]">{v.region}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
