"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOrganization, useOrganizationList, useUser } from "@clerk/nextjs";
import {
  X,
  Zap,
  LayoutDashboard,
  FolderKanban,
  Settings,
  BarChart2,
  ScanSearch,
  Bot,
  FileText,
  History,
  Map,
  Megaphone,
  Users,
  LayoutGrid,
  ChevronDown,
  Check,
  Plus,
  Activity,
  Shield,
  FileSearch,
} from "lucide-react";
import { useState } from "react";
import { CHANGELOG } from "@/lib/changelog";

const LATEST_ENTRY_DATE = CHANGELOG[0]?.date ?? "2026-01-01";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const teamNav = [
  { href: "/team", icon: LayoutGrid, label: "Team Dashboard" },
  { href: "/team/members", icon: Users, label: "Members" },
  { href: "/team/activity", icon: Activity, label: "Activity" },
  { href: "/team/sso", icon: Shield, label: "SSO" },
  { href: "/team/audit", icon: FileSearch, label: "Audit Logs" },
  { href: "/team/settings", icon: Settings, label: "Team Settings" },
];

const projectSubNav = [
  { segment: "overview", icon: BarChart2, label: "Overview" },
  { segment: "analysis", icon: ScanSearch, label: "Analysis" },
  { segment: "history", icon: History, label: "History" },
  { segment: "advisor", icon: Bot, label: "Advisor" },
  { segment: "roadmap", icon: Map, label: "Roadmap" },
  { segment: "reports", icon: FileText, label: "Reports" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function OrgSwitcher({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentName = organization?.name ?? user?.firstName ?? "Personal";
  const currentLogoUrl = organization?.imageUrl ?? user?.imageUrl;

  function toggle() {
    setOpen((v) => !v);
  }

  async function switchTo(orgId: string | null) {
    if (!setActive) return;
    await setActive({ organization: orgId });
    setOpen(false);
    router.push("/dashboard");
    onClose();
  }

  return (
    <div className="relative px-2 pb-2">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
      >
        {currentLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentLogoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white">
            {currentName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="flex-1 truncate text-left text-[#f0f0f0]">{currentName}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 top-full z-20 mt-1 rounded-lg border border-[#2a2a2a] bg-[#161616] p-1 shadow-xl">
            {/* Personal account */}
            <button
              onClick={() => switchTo(null)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
            >
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-[#2a2a2a]" />
              )}
              <span className="flex-1 truncate text-left">Personal account</span>
              {!organization && <Check className="h-3.5 w-3.5 text-[#3b82f6]" />}
            </button>

            {/* Org list */}
            {(userMemberships?.data ?? []).length > 0 && <div className="my-1 h-px bg-[#2a2a2a]" />}
            {(userMemberships?.data ?? []).map((m) => (
              <button
                key={m.organization.id}
                onClick={() => switchTo(m.organization.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
              >
                {m.organization.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.organization.imageUrl}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3b82f6]/20 text-[10px] font-bold text-[#3b82f6]">
                    {m.organization.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex-1 truncate text-left">{m.organization.name}</span>
                {organization?.id === m.organization.id && (
                  <Check className="h-3.5 w-3.5 text-[#3b82f6]" />
                )}
              </button>
            ))}

            {/* Create team */}
            <div className="my-1 h-px bg-[#2a2a2a]" />
            <Link
              href="/orgs/new"
              onClick={() => {
                setOpen(false);
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Team</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { organization } = useOrganization();

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];

  function isNavActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function isSubNavActive(segment: string) {
    if (!projectId) return false;
    const href = `/projects/${projectId}/${segment}`;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col border-r border-[#1f1f1f] bg-[#111111] transition-transform duration-200 ease-in-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar navigation"
      >
        {/* Brand */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#1f1f1f] px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]"
          >
            <Zap className="h-4 w-4 text-[#3b82f6]" />
            <span className="text-sm font-semibold text-[#f0f0f0]">AI CTO</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#606060] transition-colors hover:text-[#f0f0f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org Switcher */}
        <div className="border-b border-[#1f1f1f] py-2">
          <OrgSwitcher onClose={onClose} />
        </div>

        {/* Primary navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3" role="navigation">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose()}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]",
                isNavActive(item.href)
                  ? "bg-[#1e3a5f] text-[#3b82f6]"
                  : "text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Team navigation (only when an org is active) */}
          {organization && (
            <div className="mt-5">
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-widest text-[#606060]">
                Team
              </p>
              {teamNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]",
                    isNavActive(item.href)
                      ? "bg-[#1e3a5f] text-[#3b82f6]"
                      : "text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Project sub-navigation */}
          {projectId && (
            <div className="mt-5">
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-widest text-[#606060]">
                Project
              </p>
              {projectSubNav.map((item) => (
                <Link
                  key={item.segment}
                  href={`/projects/${projectId}/${item.segment}`}
                  onClick={() => onClose()}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]",
                    isSubNavActive(item.segment)
                      ? "bg-[#1e3a5f] text-[#3b82f6]"
                      : "text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
          {/* What's New link */}
          <div className="mt-auto pt-4">
            <Link
              href="/changelog"
              onClick={() => onClose()}
              className="flex h-9 items-center gap-2.5 rounded-md px-3 text-sm text-[#a0a0a0] transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
              data-changelog-date={LATEST_ENTRY_DATE}
            >
              <Megaphone className="h-4 w-4 shrink-0" />
              <span>{"What's New"}</span>
              <span
                className="ml-auto h-2 w-2 rounded-full bg-[#3b82f6]"
                aria-label="New updates"
              />
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
