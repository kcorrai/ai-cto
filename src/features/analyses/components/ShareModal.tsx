"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Twitter, Linkedin } from "lucide-react";

export function ShareModal({
  projectName,
  score,
  findingsCount,
  shareUrl,
  open,
  onClose,
}: {
  projectName: string;
  score: number;
  findingsCount: number;
  shareUrl: string;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tweet = `My ${projectName} scored ${score}/100 on @aictodev. AI CTO found ${findingsCount} issues. ${shareUrl}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Share your score</h2>
          <button
            onClick={onClose}
            className="text-[#606060] transition-colors hover:text-[#a0a0a0]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Score card preview */}
        <div className="mb-5 flex items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-widest text-[#606060]">
              AI CTO · SaaS Score
            </p>
            <p className="mt-2 text-5xl font-semibold tabular-nums text-[#3b82f6]">{score}</p>
            <p className="text-lg text-[#606060]">/100</p>
            <p className="mt-1 truncate text-sm text-[#a0a0a0]">{projectName}</p>
          </div>
        </div>

        {/* Tweet preview */}
        <div className="mb-5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3">
          <p className="text-xs leading-relaxed text-[#a0a0a0]">{tweet}</p>
        </div>

        {/* Share buttons */}
        <div className="space-y-2">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1DA1F2] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Twitter className="h-4 w-4" />
            Share on X / Twitter
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Linkedin className="h-4 w-4" />
            Share on LinkedIn
          </a>
          <button
            onClick={copyLink}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-[#f0f0f0] transition-colors hover:bg-[#1a1a1a]"
          >
            {copied ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
