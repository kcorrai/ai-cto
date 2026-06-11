"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "Settings";
  if (pathname === "/projects") return "Projects";

  const subMatch = pathname.match(/^\/projects\/[^/]+\/(overview|analysis|advisor|reports)/);
  if (subMatch?.[1]) {
    return subMatch[1].charAt(0).toUpperCase() + subMatch[1].slice(1);
  }

  if (pathname.startsWith("/projects/")) return "Project";

  return "AI CTO";
}

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1f1f1f] bg-[#0a0a0a] px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-[#606060] transition-colors hover:text-[#f0f0f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-semibold text-[#f0f0f0]">{title}</h1>
      </div>
      <UserButton />
    </header>
  );
}
