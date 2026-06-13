"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";

export function SettingsReferral({
  referralLink,
  totalReferrals,
  conversions,
  totalCredits,
}: {
  referralLink: string;
  totalReferrals: number;
  conversions: number;
  totalCredits: number;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const creditsDollars = (totalCredits / 100).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-center">
          <p className="text-xl font-semibold tabular-nums text-[#f0f0f0]">{totalReferrals}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#606060]">Referred</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-center">
          <p className="text-xl font-semibold tabular-nums text-[#f0f0f0]">{conversions}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#606060]">Converted</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-center">
          <p className="text-xl font-semibold tabular-nums text-[#22c55e]">${creditsDollars}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#606060]">Credits</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-[#606060]">Your referral link</p>
        <div className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2">
          <code className="flex-1 truncate text-xs text-[#a0a0a0]">{referralLink}</code>
          <button
            onClick={copy}
            className="flex-shrink-0 text-[#606060] transition-colors hover:text-[#a0a0a0]"
            aria-label="Copy referral link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#22c55e]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-[#606060]">
        <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Your referred users get 30 days free Pro trial. You earn $10 credit on their first paid
        conversion.
      </p>
    </div>
  );
}
