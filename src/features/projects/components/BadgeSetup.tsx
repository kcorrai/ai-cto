"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Style = "flat" | "flat-square" | "for-the-badge";

const STYLES: { value: Style; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "flat-square", label: "Flat square" },
  { value: "for-the-badge", label: "For the badge" },
];

export function BadgeSetup({
  projectId,
  projectUrl,
  appUrl,
}: {
  projectId: string;
  projectUrl: string;
  appUrl: string;
}) {
  const [style, setStyle] = useState<Style>("flat");
  const [copied, setCopied] = useState<string | null>(null);

  const badgeUrl = `${appUrl}/api/badge/${projectId}${style !== "flat" ? `?style=${style}` : ""}`;
  const markdown = `[![AI CTO Score](${badgeUrl})](${projectUrl})`;
  const html = `<a href="${projectUrl}"><img src="${badgeUrl}" alt="AI CTO Score"></a>`;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#606060]">
        README Badge
      </p>

      {/* Style selector */}
      <div className="mb-4 flex gap-2">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStyle(s.value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              style === s.value
                ? "bg-[#3b82f6] text-white"
                : "bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#2a2a2a]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="mb-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeUrl} alt="AI CTO Score badge preview" height={20} />
        <span className="text-xs text-[#606060]">Preview</span>
      </div>

      {/* Code blocks */}
      {[
        { label: "Markdown", key: "md", value: markdown },
        { label: "HTML", key: "html", value: html },
        { label: "Badge URL", key: "url", value: badgeUrl },
      ].map(({ label, key, value }) => (
        <div key={key} className="mb-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[#606060]">
            {label}
          </p>
          <div className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2">
            <code className="flex-1 truncate text-xs text-[#a0a0a0]">{value}</code>
            <button
              onClick={() => copy(value, key)}
              className="flex-shrink-0 text-[#606060] transition-colors hover:text-[#a0a0a0]"
              aria-label={`Copy ${label}`}
            >
              {copied === key ? (
                <Check className="h-3.5 w-3.5 text-[#22c55e]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
