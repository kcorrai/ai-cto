import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle,
  FileBarChart,
  Github,
  Quote,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "AI CTO — Your AI Technical Co-Founder",
  description:
    "Analyze your GitHub repository like a senior CTO. Get actionable insights on architecture, security, code quality, and SaaS readiness in minutes.",
  openGraph: {
    title: "AI CTO — Your AI Technical Co-Founder",
    description:
      "Analyze your GitHub repository like a senior CTO. Get actionable insights on architecture, security, code quality, and SaaS readiness in minutes.",
    images: "/api/og",
  },
};

const features = [
  {
    icon: Building2,
    title: "Architecture Analysis",
    description:
      "Detect patterns, anti-patterns, and structural issues across your entire codebase.",
  },
  {
    icon: Shield,
    title: "Security Audit",
    description:
      "Identify vulnerabilities, exposed secrets, and missing protections before your users do.",
  },
  {
    icon: Bot,
    title: "AI Advisor",
    description:
      "Ask follow-up questions about your findings. Get specific, actionable answers in context.",
  },
  {
    icon: BarChart3,
    title: "SaaS Score",
    description: "A single 0–100 score measuring your product's technical readiness for growth.",
  },
  {
    icon: FileBarChart,
    title: "Reports",
    description:
      "Export full analysis reports as PDF, Markdown, or JSON for your team or investors.",
  },
  {
    icon: TrendingUp,
    title: "Growth Readiness",
    description: "Evaluate onboarding, error states, analytics, and everything needed to scale.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect GitHub",
    description: "Link your repository in one click. Private repos supported.",
  },
  {
    number: "02",
    title: "AI Analyzes",
    description: "12 specialized modules scan your code in parallel. Done in minutes.",
  },
  {
    number: "03",
    title: "Get Your Report",
    description: "Receive a prioritized list of findings and your SaaS Score.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For solo projects and early exploration.",
    features: [
      "1 project",
      "2 analyses / month",
      "5 analysis modules",
      "Public repos only",
      "Summary report",
    ],
    cta: "Get started",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For indie hackers and solo founders.",
    features: [
      "Unlimited projects",
      "Unlimited analyses",
      "All 12 modules",
      "Private repos",
      "Full PDF reports",
      "AI Advisor (chat)",
    ],
    cta: "Start free trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/ month",
    description: "For small engineering teams.",
    features: [
      "Everything in Pro",
      "Up to 10 members",
      "Team dashboard",
      "Weekly digest emails",
      "Linear integration",
      "Priority support",
    ],
    cta: "Contact us",
    href: "mailto:yanlizcakaan@gmail.com?subject=AI%20CTO%20Team%20Plan",
    highlighted: false,
  },
];

export default async function LandingPage() {
  const testimonials = await db.testimonial.findMany({
    where: { status: "approved" },
    select: { id: true, name: true, role: true, productName: true, avatarUrl: true, quote: true },
    orderBy: { approvedAt: "desc" },
    take: 12,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3b82f6]" />
            <span className="font-semibold tracking-tight">AI CTO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-[#a0a0a0] transition-colors hover:text-[#f0f0f0]"
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-[#a0a0a0] transition-colors hover:text-[#f0f0f0]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-[#3b82f6] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111111] px-4 py-1.5 text-xs text-[#a0a0a0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          Now in early access
        </div>
        <h1 className="mb-6 text-5xl font-semibold leading-tight tracking-tight text-[#f0f0f0]">
          Your AI CTO.
          <br />
          <span className="text-[#3b82f6]">On demand.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#a0a0a0]">
          Connect your GitHub repository and get a comprehensive technical audit — architecture,
          security, code quality, and SaaS readiness — in under 3 minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-md bg-[#3b82f6] px-6 py-3 font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            <Github className="h-4 w-4" />
            Analyze your repo — free
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-md border border-[#2a2a2a] px-6 py-3 font-medium text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
          >
            See pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            How it works
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <p className="mb-3 font-mono text-4xl font-semibold text-[#1f1f1f]">
                  {step.number}
                </p>
                <h3 className="mb-2 text-lg font-semibold text-[#f0f0f0]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[#a0a0a0]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            What gets analyzed
          </p>
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight text-[#f0f0f0]">
            12 modules. One complete picture.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-6 transition-colors hover:border-[#404040]"
              >
                <feature.icon className="mb-4 h-5 w-5 text-[#3b82f6]" />
                <h3 className="mb-2 font-semibold text-[#f0f0f0]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#a0a0a0]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Score mockup */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#606060]">
                SaaS Score
              </p>
              <h2 className="mb-4 text-3xl font-semibold tracking-tight text-[#f0f0f0]">
                One number that tells
                <br />
                the whole story.
              </h2>
              <p className="mb-6 text-[#a0a0a0]">
                The SaaS Score combines 12 weighted modules into a single 0–100 metric. Track your
                progress with every analysis.
              </p>
              <ul className="space-y-3">
                {["Architecture", "Security", "Code Quality", "SaaS Maturity"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#3b82f6]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Static score card */}
            <div className="mx-auto w-full max-w-xs rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8">
              <p className="mb-6 text-xs font-medium uppercase tracking-widest text-[#606060]">
                SaaS Score
              </p>
              <div className="mb-4 flex items-end gap-2">
                <span className="font-mono text-7xl font-semibold leading-none text-[#3b82f6]">
                  74
                </span>
                <span className="mb-2 text-2xl font-semibold text-[#2a2a2a]">/100</span>
              </div>
              <p className="mb-6 text-sm font-medium text-[#a0a0a0]">Nearly There</p>
              <div className="mb-6 h-2 rounded-full bg-[#1a1a1a]">
                <div className="h-2 rounded-full bg-[#3b82f6]" style={{ width: "74%" }} />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Architecture", score: 78 },
                  { label: "Security", score: 41 },
                  { label: "Code Quality", score: 68 },
                  { label: "Dependencies", score: 85 },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-[#606060]">{m.label}</span>
                    <div className="flex-1 rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-1 rounded-full bg-[#2a2a2a]"
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs text-[#606060]">
                      {m.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            Pricing
          </p>
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight text-[#f0f0f0]">
            Start free. Scale when you need to.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.highlighted
                    ? "border-[#3b82f6] bg-[#111111] ring-1 ring-[#3b82f6]/20"
                    : "border-[#2a2a2a] bg-[#111111]"
                }`}
              >
                {plan.highlighted && (
                  <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#3b82f6]">
                    Most popular
                  </p>
                )}
                <h3 className="mb-1 font-semibold text-[#f0f0f0]">{plan.name}</h3>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-[#f0f0f0]">{plan.price}</span>
                  <span className="text-sm text-[#606060]">{plan.period}</span>
                </div>
                <p className="mb-6 text-sm text-[#606060]">{plan.description}</p>
                <ul className="mb-8 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#a0a0a0]">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full rounded-md py-2.5 text-center text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                      : "border border-[#2a2a2a] text-[#a0a0a0] hover:border-[#404040] hover:text-[#f0f0f0]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#606060]">
            Need a full comparison?{" "}
            <Link href="/pricing" className="text-[#3b82f6] hover:underline">
              See all plan details →
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials wall */}
      {testimonials.length > 0 && (
        <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
              Wall of love
            </p>
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight text-[#f0f0f0]">
              Trusted by builders worldwide
            </h2>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="mb-4 break-inside-avoid rounded-xl border border-[#2a2a2a] bg-[#111111] p-5"
                >
                  <Quote className="mb-3 h-4 w-4 text-[#3b82f6]" />
                  <p className="mb-4 text-sm leading-relaxed text-[#a0a0a0]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    {t.avatarUrl ? (
                      <Image
                        src={t.avatarUrl}
                        alt={t.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-xs font-medium text-[#606060]">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-[#f0f0f0]">{t.name}</p>
                      {(t.role ?? t.productName) && (
                        <p className="text-[10px] text-[#606060]">{t.role ?? t.productName}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div>
              <Link href="/" className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#3b82f6]" />
                <span className="font-semibold text-[#f0f0f0]">AI CTO</span>
              </Link>
              <p className="text-xs text-[#606060]">Your AI Technical Co-Founder.</p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#606060]">
                  Product
                </p>
                <ul className="space-y-2.5 text-sm text-[#a0a0a0]">
                  <li>
                    <Link href="/pricing" className="hover:text-[#f0f0f0]">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="hover:text-[#f0f0f0]">
                      Sign up
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-in" className="hover:text-[#f0f0f0]">
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#606060]">
                  Legal
                </p>
                <ul className="space-y-2.5 text-sm text-[#a0a0a0]">
                  <li>
                    <Link href="/privacy" className="hover:text-[#f0f0f0]">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-[#f0f0f0]">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-[#1f1f1f] pt-8 text-xs text-[#606060]">
            © {new Date().getFullYear()} AI CTO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
