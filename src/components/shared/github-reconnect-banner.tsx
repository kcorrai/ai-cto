import Link from "next/link";

export function GitHubReconnectBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#f97316]/30 bg-[#f97316]/5 px-4 py-3">
      <span className="shrink-0 text-sm text-[#f97316]">⚠</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#f0f0f0]">GitHub connection expired</p>
        <p className="mt-0.5 text-xs text-[#a0a0a0]">
          Your GitHub token has expired. Analyses will fail until you reconnect.
        </p>
      </div>
      <Link
        href="/api/auth/github/connect"
        className="shrink-0 rounded-md bg-[#f97316] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
      >
        Reconnect GitHub
      </Link>
    </div>
  );
}
