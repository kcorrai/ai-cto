import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — AI CTO",
  description: "Simple, transparent pricing. Start free and upgrade when you need more.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For solo projects and early exploration.",
    highlighted: false,
    cta: "Get started free",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For indie hackers and solo founders.",
    highlighted: true,
    cta: "Start free trial",
    href: "/sign-up",
    annualNote: "$290 / year (save 2 months)",
  },
  {
    name: "Team",
    price: "$99",
    period: "/ month",
    description: "For small engineering teams.",
    highlighted: false,
    cta: "Contact us",
    href: "/sign-up",
    annualNote: "$990 / year (save 2 months)",
  },
];

type FeatureValue = string | boolean;

const featureRows: { label: string; values: FeatureValue[] }[] = [
  { label: "Projects", values: ["1", "Unlimited", "Unlimited"] },
  { label: "Analyses / month", values: ["2", "Unlimited", "Unlimited"] },
  { label: "Analysis modules", values: ["5 of 12", "All 12", "All 12"] },
  { label: "Private repositories", values: [false, true, true] },
  { label: "AI Advisor (chat)", values: [false, true, true] },
  { label: "Full PDF reports", values: [false, true, true] },
  { label: "Report export (MD, JSON)", values: [false, true, true] },
  { label: "API access", values: [false, true, true] },
  { label: "Team members", values: ["1", "1", "Up to 10"] },
  { label: "Team dashboard", values: [false, false, true] },
  { label: "Weekly digest emails", values: [false, false, true] },
  { label: "Linear integration", values: [false, false, true] },
  { label: "Priority support", values: [false, false, true] },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <CheckCircle className="mx-auto h-4 w-4 text-[#3b82f6]" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-[#2a2a2a]" />
    );
  }
  return <span className="text-sm text-[#a0a0a0]">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#606060]">
            Pricing
          </p>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-[#f0f0f0]">
            Simple, transparent pricing
          </h1>
          <p className="text-[#a0a0a0]">Start free. No credit card required.</p>
        </div>

        {/* Tier cards */}
        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 ${
                tier.highlighted
                  ? "border-[#3b82f6] bg-[#111111] ring-1 ring-[#3b82f6]/20"
                  : "border-[#2a2a2a] bg-[#111111]"
              }`}
            >
              {tier.highlighted && (
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#3b82f6]">
                  Most popular
                </p>
              )}
              <h2 className="mb-1 text-lg font-semibold text-[#f0f0f0]">{tier.name}</h2>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-[#f0f0f0]">{tier.price}</span>
                <span className="text-sm text-[#606060]">{tier.period}</span>
              </div>
              {tier.annualNote && <p className="mb-2 text-xs text-[#606060]">{tier.annualNote}</p>}
              <p className="mb-6 text-sm text-[#606060]">{tier.description}</p>
              <Link
                href={tier.href}
                className={`block w-full rounded-md py-2.5 text-center text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                    : "border border-[#2a2a2a] text-[#a0a0a0] hover:border-[#404040] hover:text-[#f0f0f0]"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111111]">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-widest text-[#606060]">
                  Feature
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier.name}
                    className={`px-4 py-4 text-center text-sm font-semibold ${
                      tier.highlighted ? "text-[#3b82f6]" : "text-[#f0f0f0]"
                    }`}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-b border-[#1f1f1f] ${
                    i % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#0d0d0d]"
                  }`}
                >
                  <td className="px-6 py-3.5 text-sm text-[#a0a0a0]">{row.label}</td>
                  {row.values.map((value, j) => (
                    <td key={j} className="px-4 py-3.5 text-center">
                      <FeatureCell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-sm text-[#606060]">
            Questions?{" "}
            <a href="mailto:hello@aicto.dev" className="text-[#3b82f6] hover:underline">
              hello@aicto.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
