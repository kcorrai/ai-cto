"use client";

import { useState } from "react";

export function AutoAnalyzeToggle({
  projectId,
  initialEnabled,
  isPro,
}: {
  projectId: string;
  initialEnabled: boolean;
  isPro: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isPro) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoAnalyze: !enabled }),
      });
      if (res.ok) setEnabled((v) => !v);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] px-5 py-4">
      <div>
        <p className="text-sm font-medium text-[#f0f0f0]">Auto-analyze on push</p>
        <p className="mt-0.5 text-xs text-[#606060]">
          {isPro
            ? "Re-analyze automatically when code is pushed to this branch."
            : "Upgrade to Pro to enable automatic re-analysis on push."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading || !isPro}
        aria-pressed={enabled}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          enabled ? "bg-[#3b82f6]" : "bg-[#2a2a2a]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
