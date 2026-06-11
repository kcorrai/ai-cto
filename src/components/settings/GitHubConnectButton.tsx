"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";

interface GitHubConnectButtonProps {
  isConnected: boolean;
}

export function GitHubConnectButton({ isConnected }: GitHubConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    setLoading(true);
    await fetch("/api/auth/github/disconnect", { method: "DELETE" });
    window.location.reload();
  }

  if (isConnected) {
    return (
      <button
        onClick={handleDisconnect}
        disabled={loading}
        className="flex items-center gap-2 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:border-[#ef4444]/40 hover:text-[#ef4444] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Disconnect
      </button>
    );
  }

  return (
    <a
      href="/api/auth/github/connect"
      onClick={() => setLoading(true)}
      className="flex items-center gap-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 text-sm text-[#f0f0f0] transition-colors hover:bg-[#222222]"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Github className="h-3.5 w-3.5" />
      )}
      Connect GitHub
    </a>
  );
}
