"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import type { Plan } from "@prisma/client";

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<Plan, string> = {
  free: "text-[#606060] bg-[#1a1a1a]",
  pro: "text-[#3b82f6] bg-[#1e3a5f]",
  team: "text-[#22c55e] bg-[#14532d]",
  enterprise: "text-[#f59e0b] bg-[#451a03]",
};

type Props = {
  plan: Plan;
  analysesThisMonth: number;
  maxAnalysesPerMonth: number;
  hasStripeCustomer: boolean;
};

export function SettingsBilling({
  plan,
  analysesThisMonth,
  maxAnalysesPerMonth,
  hasStripeCustomer,
}: Props) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);

  async function handleCheckout(interval: "monthly" | "yearly") {
    setLoading("checkout");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  const usageLabel =
    maxAnalysesPerMonth === Infinity
      ? `${analysesThisMonth} this month`
      : `${analysesThisMonth} / ${maxAnalysesPerMonth} this month`;

  const usagePct =
    maxAnalysesPerMonth === Infinity ? 0 : (analysesThisMonth / maxAnalysesPerMonth) * 100;

  return (
    <div className="space-y-5">
      {/* Plan badge + usage */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${PLAN_COLORS[plan]}`}
            >
              {PLAN_LABELS[plan]}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#606060]">Analyses: {usageLabel}</p>
          {maxAnalysesPerMonth !== Infinity && (
            <div className="mt-1.5 h-1 w-48 overflow-hidden rounded-full bg-[#1f1f1f]">
              <div
                className="h-full rounded-full bg-[#3b82f6] transition-all"
                style={{ width: `${Math.min(usagePct, 100)}%` }}
              />
            </div>
          )}
        </div>

        {plan === "free" ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => void handleCheckout("monthly")}
              disabled={!!loading}
              className="flex items-center gap-2 rounded-md bg-[#3b82f6] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50"
            >
              {loading === "checkout" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Upgrade to Pro — $29/mo
            </button>
            <button
              onClick={() => void handleCheckout("yearly")}
              disabled={!!loading}
              className="rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0] disabled:opacity-50"
            >
              Annual — $290/yr (save 17%)
            </button>
          </div>
        ) : (
          <button
            onClick={() => void handlePortal()}
            disabled={!!loading || !hasStripeCustomer}
            className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-sm text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0] disabled:opacity-50"
          >
            {loading === "portal" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Manage Billing
          </button>
        )}
      </div>
    </div>
  );
}
