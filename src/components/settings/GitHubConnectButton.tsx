"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";

interface GitHubConnectButtonProps {
  isConnected: boolean;
  hasAppInstallation?: boolean;
  useGitHubApp?: boolean;
}

export function GitHubConnectButton({
  isConnected,
  hasAppInstallation = false,
  useGitHubApp = false,
}: GitHubConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    setLoading(true);
    if (hasAppInstallation) {
      // Remove only the local installation ID; actual uninstall happens on GitHub
      await fetch("/api/auth/github/disconnect", { method: "DELETE" });
    } else {
      await fetch("/api/auth/github/disconnect", { method: "DELETE" });
    }
    window.location.reload();
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        {hasAppInstallation && (
          <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">
            GitHub App
          </span>
        )}
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="flex items-center gap-2 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:border-[#ef4444]/40 hover:text-[#ef4444] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Disconnect
        </button>
      </div>
    );
  }

  const connectHref = useGitHubApp ? "/api/github/app/install" : "/api/auth/github/connect";

  return (
    <a
      href={connectHref}
      onClick={() => setLoading(true)}
      className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-sm text-[#f0f0f0] transition-colors hover:bg-[#222222]"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Github className="h-3.5 w-3.5" />
      )}
      {useGitHubApp ? "Install GitHub App" : "Connect GitHub"}
    </a>
  );
}
