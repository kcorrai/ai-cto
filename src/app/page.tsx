import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle,
  Code2,
  Database,
  FileBarChart,
  Github,
  Globe,
  Quote,
  Shield,
  TestTube,
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

const modules = [
  { icon: Building2, label: "Architecture", color: "#3b82f6", score: 78 },
  { icon: Shield, label: "Security", color: "#ef4444", score: 41 },
  { icon: Code2, label: "Code Quality", color: "#22c55e", score: 82 },
  { icon: Database, label: "Database Design", color: "#f59e0b", score: 65 },
  { icon: TestTube, label: "Test Coverage", color: "#8b5cf6", score: 54 },
  { icon: Globe, label: "API Design", color: "#06b6d4", score: 71 },
  { icon: TrendingUp, label: "Performance", color: "#f97316", score: 69 },
  { icon: FileBarChart, label: "Documentation", color: "#ec4899", score: 48 },
];

const features = [
  {
    icon: Building2,
    title: "Architecture Analysis",
    description:
      "Detect patterns, anti-patterns, and structural issues across your entire codebase.",
    color: "#3b82f6",
    bg: "#1e3a5f",
  },
  {
    icon: Shield,
    title: "Security Audit",
    description:
      "Identify vulnerabilities, exposed secrets, and missing protections before your users do.",
    color: "#ef4444",
    bg: "#450a0a",
  },
  {
    icon: Bot,
    title: "AI Advisor",
    description:
      "Ask follow-up questions about your findings. Get specific, actionable answers in context.",
    color: "#22c55e",
    bg: "#052e16",
  },
  {
    icon: BarChart3,
    title: "SaaS Score",
    description: "A single 0–100 score measuring your product's technical readiness for growth.",
    color: "#f59e0b",
    bg: "#451a03",
  },
  {
    icon: FileBarChart,
    title: "PDF Reports",
    description:
      "Export full analysis reports as PDF, Markdown, or JSON for your team or investors.",
    color: "#8b5cf6",
    bg: "#2e1065",
  },
  {
    icon: TrendingUp,
    title: "Growth Readiness",
    description: "Evaluate onboarding, error states, analytics, and everything needed to scale.",
    color: "#06b6d4",
    bg: "#083344",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect GitHub",
    description: "Link your repository in one click. Public or private repos supported.",
    icon: Github,
  },
  {
    number: "02",
    title: "AI Analyzes",
    description: "12 specialized modules scan your code in parallel. Done in under 3 minutes.",
    icon: Bot,
  },
  {
    number: "03",
    title: "Get Your Report",
    description: "Receive a prioritized list of findings and your SaaS Score with action items.",
    icon: FileBarChart,
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

const stats = [
  { value: "12", label: "Analysis Modules" },
  { value: "< 3min", label: "Analysis Time" },
  { value: "100+", label: "Issue Types Detected" },
  { value: "0–100", label: "SaaS Score Range" },
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
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-[#a0a0a0] transition-colors hover:text-[#f0f0f0]"
            >
              Pricing
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-[#a0a0a0] transition-colors hover:text-[#f0f0f0]"
            >
              Leaderboard
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
      <section className="relative overflow-hidden px-6 pb-0 pt-20">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[600px] w-[900px] rounded-full bg-[#3b82f6]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111111] px-4 py-1.5 text-xs text-[#a0a0a0]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e]" />
            Now in early access · No credit card required
          </div>

          <h1 className="mb-6 text-6xl font-bold leading-[1.1] tracking-tight text-[#f0f0f0]">
            Your AI CTO,
            <br />
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              available 24/7
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-[#707070]">
            Connect your GitHub repository and get a comprehensive technical audit — architecture,
            security, code quality, and SaaS readiness — in under 3 minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#3b82f6]/25 transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/40"
            >
              <Github className="h-5 w-5" />
              Analyze your repo — free
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#111111] px-7 py-3.5 text-base font-medium text-[#a0a0a0] transition-all hover:border-[#404040] hover:text-[#f0f0f0]"
            >
              See pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

            {/* Mock browser frame */}
            <div className="rounded-t-2xl border border-[#2a2a2a] bg-[#111111] shadow-2xl shadow-black/60">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-[#ef4444]/60" />
                <div className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
                <div className="h-3 w-3 rounded-full bg-[#22c55e]/60" />
                <div className="mx-auto flex h-6 items-center rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-xs text-[#404040]">
                  ai-cto-dusky.vercel.app/projects/abc123/analysis
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="flex h-[420px] overflow-hidden">
                {/* Sidebar */}
                <div className="hidden w-52 shrink-0 border-r border-[#1f1f1f] p-4 sm:block">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-[#3b82f6]/20" />
                    <div className="h-3 w-16 rounded bg-[#2a2a2a]" />
                  </div>
                  {["Overview", "Analysis", "History", "AI Advisor", "Roadmap", "Reports"].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`mb-1 flex items-center gap-2.5 rounded-md px-3 py-2 ${i === 1 ? "bg-[#1e3a5f]" : ""}`}
                      >
                        <div
                          className={`h-2.5 w-2.5 rounded-sm ${i === 1 ? "bg-[#3b82f6]" : "bg-[#2a2a2a]"}`}
                        />
                        <span
                          className={`text-xs ${i === 1 ? "text-[#3b82f6]" : "text-[#404040]"}`}
                        >
                          {item}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Main area */}
                <div className="flex-1 overflow-hidden p-6">
                  {/* Header */}
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <div className="mb-1 h-3 w-20 rounded bg-[#2a2a2a]" />
                      <div className="h-5 w-44 rounded bg-[#333333]" />
                    </div>
                    <div className="h-8 w-24 rounded-md bg-[#1e3a5f]" />
                  </div>

                  {/* Score card */}
                  <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-2 h-2.5 w-16 rounded bg-[#2a2a2a]" />
                        <div className="flex items-end gap-1">
                          <span className="font-mono text-5xl font-bold text-[#3b82f6]">74</span>
                          <span className="mb-1 text-lg text-[#333333]">/100</span>
                        </div>
                        <div className="mt-1 h-2.5 w-20 rounded bg-[#2a2a2a]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {modules.slice(0, 4).map((m) => (
                          <div
                            key={m.label}
                            className="rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-[#505050]">{m.label}</span>
                              <span
                                className="font-mono text-xs font-semibold"
                                style={{ color: m.color }}
                              >
                                {m.score}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${m.score}%`, backgroundColor: m.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Findings list */}
                  <div className="space-y-2">
                    {[
                      {
                        sev: "critical",
                        text: "Hardcoded API key found in config.ts",
                        color: "#ef4444",
                      },
                      {
                        sev: "high",
                        text: "Missing rate limiting on /api/auth endpoints",
                        color: "#f97316",
                      },
                      {
                        sev: "medium",
                        text: "No error boundaries in React component tree",
                        color: "#f59e0b",
                      },
                    ].map((f) => (
                      <div
                        key={f.text}
                        className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-2.5"
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: f.color }}
                        />
                        <span className="text-xs font-medium capitalize" style={{ color: f.color }}>
                          {f.sev}
                        </span>
                        <span className="text-xs text-[#606060]">{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="mb-1 font-mono text-3xl font-bold text-[#f0f0f0]">{s.value}</p>
                <p className="text-xs text-[#606060]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            How it works
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            From repo to report in 3 steps
          </h2>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent md:block" />

            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Step circle */}
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#111111]">
                  <step.icon className="h-7 w-7 text-[#3b82f6]" />
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#f0f0f0]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[#707070]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Score deep dive */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#3b82f6]">
                SaaS Score
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
                One number that tells
                <br />
                the whole story.
              </h2>
              <p className="mb-8 leading-relaxed text-[#707070]">
                The SaaS Score combines 12 weighted modules into a single 0–100 metric. Track your
                progress with every analysis and see exactly what to fix first.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Architecture",
                  "Security",
                  "Code Quality",
                  "Performance",
                  "Testing",
                  "Documentation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#3b82f6]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Rich score card */}
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 shadow-2xl shadow-black/50">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-widest text-[#606060]">
                    SaaS Score
                  </span>
                  <span className="rounded-full bg-[#f59e0b]/10 px-2.5 py-0.5 text-xs font-semibold text-[#f59e0b]">
                    Nearly There
                  </span>
                </div>

                <div className="mb-5 flex items-end gap-2">
                  <span className="font-mono text-7xl font-bold leading-none text-[#3b82f6]">
                    74
                  </span>
                  <span className="mb-2 text-2xl text-[#2a2a2a]">/100</span>
                </div>

                {/* Progress bar */}
                <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
                    style={{ width: "74%" }}
                  />
                </div>

                <div className="space-y-3">
                  {modules.map((m) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <m.icon className="h-3.5 w-3.5 shrink-0" style={{ color: m.color }} />
                      <span className="w-32 text-xs text-[#606060]">{m.label}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${m.score}%`, backgroundColor: m.color }}
                        />
                      </div>
                      <span
                        className="w-8 text-right font-mono text-xs font-semibold"
                        style={{ color: m.color }}
                      >
                        {m.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            What gets analyzed
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            12 modules. One complete picture.
          </h2>
          <p className="mb-12 text-center text-[#707070]">
            Every analysis runs all modules in parallel — architecture, security, performance, and
            more.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-[#2a2a2a] bg-[#111111] p-6 transition-all hover:border-[#404040] hover:shadow-lg hover:shadow-black/30"
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>
                <h3 className="mb-2 font-semibold text-[#f0f0f0]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#707070]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Advisor highlight */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Chat mockup */}
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] overflow-hidden shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[#1f1f1f] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#052e16]">
                  <Bot className="h-4 w-4 text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f0f0f0]">AI Advisor</p>
                  <p className="text-xs text-[#606060]">Technical Co-Founder</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <span className="text-xs text-[#22c55e]">Online</span>
                </div>
              </div>
              {/* Messages */}
              <div className="space-y-4 p-5">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#052e16]">
                    <Bot className="h-3.5 w-3.5 text-[#22c55e]" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-[#1a1a1a] px-4 py-3 text-sm text-[#a0a0a0]">
                    I found 3 critical security issues in your codebase. The most urgent is a
                    hardcoded API key in <code className="text-[#3b82f6]">config.ts:14</code>. Want
                    me to walk you through fixing it?
                  </div>
                </div>
                <div className="flex flex-row-reverse gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f]">
                    <span className="text-xs font-bold text-[#3b82f6]">Y</span>
                  </div>
                  <div className="rounded-2xl rounded-tr-none bg-[#1e3a5f] px-4 py-3 text-sm text-[#a0a0a0]">
                    Yes please, and how should I handle secrets in production?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#052e16]">
                    <Bot className="h-3.5 w-3.5 text-[#22c55e]" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-[#1a1a1a] px-4 py-3 text-sm text-[#a0a0a0]">
                    For your Next.js app, use <code className="text-[#22c55e]">process.env</code>{" "}
                    with <code className="text-[#22c55e]">.env.local</code> and never commit secrets
                    to git. I&apos;ll generate a refactored version of your config file...
                  </div>
                </div>
                {/* Input area */}
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-2.5">
                  <span className="flex-1 text-xs text-[#404040]">Ask about your codebase...</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6]">
                    <ArrowRight className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#22c55e]">
                AI Advisor
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
                Ask your AI CTO
                <br />
                anything about your code.
              </h2>
              <p className="mb-6 leading-relaxed text-[#707070]">
                After every analysis, chat directly with your AI Advisor. Ask about specific
                findings, get refactoring advice, or understand architectural trade-offs — all in
                context of your actual codebase.
              </p>
              <ul className="space-y-3">
                {[
                  "Explains findings in plain English",
                  "Suggests specific code fixes",
                  "Prioritizes what to fix first",
                  "Context-aware — knows your stack",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#22c55e]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            Pricing
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            Start free. Scale when you need to.
          </h2>
          <p className="mb-12 text-center text-[#707070]">
            No credit card required. Upgrade anytime.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-[#3b82f6] bg-[#111111] shadow-lg shadow-[#3b82f6]/10"
                    : "border-[#2a2a2a] bg-[#111111]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#3b82f6] px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  </div>
                )}
                <h3 className="mb-1 font-semibold text-[#f0f0f0]">{plan.name}</h3>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#f0f0f0]">{plan.price}</span>
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
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-[#3b82f6] text-white shadow-md shadow-[#3b82f6]/30 hover:bg-[#2563eb]"
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

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
              Wall of love
            </p>
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
              Trusted by builders worldwide
            </h2>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="mb-4 break-inside-avoid rounded-xl border border-[#2a2a2a] bg-[#111111] p-5 transition-colors hover:border-[#404040]"
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-xs font-bold text-white">
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

      {/* Final CTA */}
      <section className="relative overflow-hidden py-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[600px] rounded-full bg-[#3b82f6]/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#f0f0f0]">
            Ready to see your
            <br />
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              SaaS Score?
            </span>
          </h2>
          <p className="mb-10 text-lg text-[#707070]">
            Join hundreds of founders who use AI CTO to ship better software, faster.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#3b82f6]/30 transition-all hover:bg-[#2563eb] hover:shadow-[#3b82f6]/50"
          >
            <Github className="h-5 w-5" />
            Analyze your repo — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-[#404040]">
            No credit card required · Setup in 60 seconds
          </p>
        </div>
      </section>

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
                    <Link href="/leaderboard" className="hover:text-[#f0f0f0]">
                      Leaderboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/changelog" className="hover:text-[#f0f0f0]">
                      Changelog
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="hover:text-[#f0f0f0]">
                      Sign up
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#606060]">
                  Docs
                </p>
                <ul className="space-y-2.5 text-sm text-[#a0a0a0]">
                  <li>
                    <Link href="/docs/api" className="hover:text-[#f0f0f0]">
                      API Reference
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/github-actions" className="hover:text-[#f0f0f0]">
                      GitHub Actions
                    </Link>
                  </li>
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
