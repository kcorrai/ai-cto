"use client";

import { X, Zap } from "lucide-react";

interface PlanLimitModalProps {
  onClose: () => void;
}

export function PlanLimitModal({ onClose }: PlanLimitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-[#606060] transition-colors hover:text-[#f0f0f0]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a5f]">
          <Zap className="h-5 w-5 text-[#3b82f6]" />
        </div>

        <h2 className="mb-2 text-base font-semibold text-[#f0f0f0]">Project limit reached</h2>
        <p className="mb-6 text-sm text-[#a0a0a0]">
          You&apos;ve reached your project limit on the Free plan. Upgrade to Pro to connect
          unlimited repositories.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href="/api/stripe/checkout"
            className="flex items-center justify-center gap-2 rounded-md bg-[#3b82f6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </a>
          <button
            onClick={onClose}
            className="rounded-md py-2.5 text-sm text-[#606060] transition-colors hover:text-[#f0f0f0]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
