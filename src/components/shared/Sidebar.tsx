"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const projectSubNav = [
  { segment: "overview", icon: BarChart2, label: "Overview" },
  { segment: "analysis", icon: ScanSearch, label: "Analysis" },
  { segment: "advisor", icon: Bot, label: "Advisor" },
  { segment: "reports", icon: FileText, label: "Reports" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
        </nav>
      </aside>
    </>
  );
}
