import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  Shield,
  UserCheck,
  FileSearch,
  Clock,
  Key,
  BarChart2,
  AlertTriangle,
  Settings,
  ChevronRight,
  Palette,
  Server,
} from "lucide-react";

export default async function EnterpriseAdminPage() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) redirect("/team");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      plan: true,
      _count: { select: { members: true, projects: true } },
    },
  });

  if (!org) redirect("/team");

  if (org.plan !== "enterprise") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] mb-4">
          <Shield className="h-6 w-6 text-[#404040]" />
        </div>
        <h2 className="text-base font-medium text-[#f0f0f0] mb-2">Enterprise Feature</h2>
        <p className="text-sm text-[#606060] mb-6 max-w-xs">
          The Enterprise Admin Console is available on the Enterprise plan.
        </p>
        <a
          href="/settings"
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] transition-colors"
        >
          Upgrade to Enterprise
        </a>
      </div>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [analysesThisMonth, criticalFindings, apiKeyCount] = await Promise.all([
    db.analysis.count({
      where: { project: { organizationId: org.id }, createdAt: { gte: startOfMonth } },
    }),
    db.finding.count({
      where: { project: { organizationId: org.id }, severity: "critical", isResolved: false },
    }),
    db.apiKey.count({
      where: {
        user: { orgMemberships: { some: { organizationId: org.id } } },
        isActive: true,
      },
    }),
  ]);

  const adminSections = [
    {
      title: "Team Management",
      items: [
        {
          href: "/team/members",
          icon: Users,
          label: "Members",
          desc: `${org._count.members} members`,
        },
        {
          href: "/team/activity",
          icon: BarChart2,
          label: "Activity Log",
          desc: "Recent member activity",
        },
      ],
    },
    {
      title: "Security & Compliance",
      items: [
        {
          href: "/team/sso",
          icon: Shield,
          label: "SSO / SCIM",
          desc: "SAML & user provisioning",
        },
        {
          href: "/team/audit",
          icon: FileSearch,
          label: "Audit Logs",
          desc: "Tamper-evident event log",
        },
        {
          href: "/team/soc2",
          icon: Shield,
          label: "SOC 2 Compliance",
          desc: "Security controls & checklist",
        },
      ],
    },
    {
      title: "Projects",
      items: [
        {
          href: "/projects",
          icon: FolderKanban,
          label: "All Projects",
          desc: `${org._count.projects} active projects`,
        },
        {
          href: "/team",
          icon: BarChart2,
          label: "Team Dashboard",
          desc: `${analysesThisMonth} analyses this month`,
        },
      ],
    },
    {
      title: "Configuration",
      items: [
        {
          href: "/team/settings",
          icon: Settings,
          label: "Team Settings",
          desc: "Integrations, billing, retention",
        },
        {
          href: "/team/settings#branding",
          icon: Palette,
          label: "White-Label Branding",
          desc: "Logo & report customization",
        },
        {
          href: "/team/settings#ghe",
          icon: Server,
          label: "GitHub Enterprise",
          desc: "Self-hosted GHE connection",
        },
        {
          href: "/team/settings#retention",
          icon: Clock,
          label: "Data Retention",
          desc: "Compliance & deletion policies",
        },
      ],
    },
    {
      title: "API & Developer",
      items: [
        {
          href: "/settings/api-keys",
          icon: Key,
          label: "API Keys",
          desc: `${apiKeyCount} active keys`,
        },
        {
          href: "/api-docs",
          icon: FileSearch,
          label: "API Documentation",
          desc: "OpenAPI spec & endpoints",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-[#f0f0f0]">Enterprise Admin Console</h1>
        <p className="mt-1 text-sm text-[#606060]">{org.name}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Members", value: org._count.members, icon: Users },
          { label: "Projects", value: org._count.projects, icon: FolderKanban },
          { label: "Analyses (MTD)", value: analysesThisMonth, icon: BarChart2 },
          {
            label: "Critical Findings",
            value: criticalFindings,
            icon: AlertTriangle,
            danger: criticalFindings > 0,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
            <div className="mb-1 flex items-center gap-2">
              <s.icon className={`h-3.5 w-3.5 ${s.danger ? "text-red-400" : "text-[#606060]"}`} />
              <span className="text-xs text-[#606060]">{s.label}</span>
            </div>
            <p className={`text-2xl font-semibold ${s.danger ? "text-red-400" : "text-[#f0f0f0]"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Navigation sections */}
      <div className="grid gap-6 sm:grid-cols-2">
        {adminSections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[#606060]">
              {section.title}
            </h2>
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] divide-y divide-[#1a1a1a] overflow-hidden">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors group"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#606060] group-hover:text-[#a0a0a0] transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#d0d0d0]">{item.label}</p>
                    <p className="text-xs text-[#606060]">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#404040] group-hover:text-[#606060] transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SSO/SCIM quick links */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="h-4 w-4 text-[#3b82f6]" />
          <h3 className="text-xs font-medium text-[#d0d0d0]">Identity & Access Management</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/team/sso"
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
          >
            Configure SAML SSO
          </Link>
          <Link
            href="/team/sso"
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
          >
            SCIM Provisioning
          </Link>
          <Link
            href="/team/audit"
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
          >
            View Audit Logs
          </Link>
        </div>
      </div>
    </div>
  );
}
