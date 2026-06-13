"use client";

import { useState } from "react";
import { CreditCard, Check, Loader2, ExternalLink } from "lucide-react";

type Props = {
  plan: string;
  hasStripeCustomer: boolean;
};

const TEAM_FEATURES = [
  "Up to 20 projects",
  "Unlimited analyses",
  "All 12 analysis modules",
  "Private repositories",
  "Up to 10 team members",
  "Slack & webhook integrations",
  "Scheduled analyses",
  "Priority support",
];

export function TeamBilling({ plan, hasStripeCustomer }: Props) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/orgs/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval }),
    });
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/orgs/billing/portal", { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } else {
      setPortalLoading(false);
    }
  }

  const isTeam = plan === "team" || plan === "enterprise";

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
          <CreditCard className="h-4 w-4 text-[#3b82f6]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#f0f0f0]">Team Plan</h3>
          <p className="text-xs text-[#606060]">
            Current plan: <span className="capitalize text-[#a0a0a0]">{plan}</span>
          </p>
        </div>
      </div>

      {isTeam ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="h-4 w-4" />
            Team plan active
          </div>
          {hasStripeCustomer && (
            <button
              onClick={() => void openPortal()}
              disabled={portalLoading}
              className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm text-[#a0a0a0] transition-colors hover:border-[#3b82f6]/50 hover:text-[#f0f0f0]"
            >
              {portalLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              Manage billing
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setInterval("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                interval === "monthly"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#f0f0f0]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                interval === "yearly"
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#f0f0f0]"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] text-green-400">Save 20%</span>
            </button>
          </div>

          <ul className="mb-4 space-y-1.5">
            {TEAM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-[#a0a0a0]">
                <Check className="h-3 w-3 shrink-0 text-[#3b82f6]" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => void checkout()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Upgrade to Team — 14-day free trial
          </button>
        </div>
      )}
    </div>
  );
}
