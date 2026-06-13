"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";

export function ShareButton({
  projectName,
  score,
  findingsCount,
  shareUrl,
}: {
  projectName: string;
  score: number;
  findingsCount: number;
  shareUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
      <ShareModal
        projectName={projectName}
        score={score}
        findingsCount={findingsCount}
        shareUrl={shareUrl}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
