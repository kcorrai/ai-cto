import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle,
  Code2,
  Database,
  Download,
  FileBarChart,
  FileJson,
  FileText,
  Filter,
  Github,
  GitBranch,
  Globe,
  Key,
  Network,
  Package,
  Quote,
  RefreshCw,
  Rocket,
  Search,
  Share2,
  Shield,
  Sparkles,
  Tag,
  Target,
  TestTube,
  TrendingUp,
  Users,
  Webhook,
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

const allModules = [
  {
    icon: Building2,
    label: "Architecture",
    color: "#3b82f6",
    bg: "#0f2040",
    score: 78,
    desc: "Patterns, anti-patterns & structural issues",
    findings: ["Missing service layer abstraction", "Circular deps in /lib"],
  },
  {
    icon: Shield,
    label: "Security",
    color: "#ef4444",
    bg: "#200f0f",
    score: 41,
    desc: "Vulnerabilities, secrets & missing protections",
    findings: ["Hardcoded API key in config.ts:14", "No CSRF protection"],
  },
  {
    icon: Code2,
    label: "Code Quality",
    color: "#22c55e",
    bg: "#0f2018",
    score: 82,
    desc: "Maintainability, complexity & code smells",
    findings: ["3 functions with complexity > 15", "Inconsistent error handling"],
  },
  {
    icon: Package,
    label: "Dependencies",
    color: "#f59e0b",
    bg: "#201a0f",
    score: 65,
    desc: "Outdated packages, CVEs & license risks",
    findings: ["4 packages with known CVEs", "lodash replaceable with native"],
  },
  {
    icon: Rocket,
    label: "Product Readiness",
    color: "#8b5cf6",
    bg: "#170f20",
    score: 58,
    desc: "Onboarding, error states & growth features",
    findings: ["No empty state handling", "Missing error boundaries"],
  },
  {
    icon: Activity,
    label: "Performance",
    color: "#f97316",
    bg: "#201508",
    score: 69,
    desc: "Bundle size, query optimization & bottlenecks",
    findings: ["N+1 query in /api/users", "Missing DB indexes on FK cols"],
  },
  {
    icon: TestTube,
    label: "Test Coverage",
    color: "#06b6d4",
    bg: "#082020",
    score: 54,
    desc: "Test completeness, quality & coverage gaps",
    findings: ["Auth flow has 0% coverage", "No integration tests for payments"],
  },
  {
    icon: BookOpen,
    label: "Documentation",
    color: "#ec4899",
    bg: "#20081a",
    score: 48,
    desc: "README quality, inline docs & API docs",
    findings: ["No API documentation found", "README missing setup guide"],
  },
  {
    icon: Globe,
    label: "API Design",
    color: "#a855f7",
    bg: "#140820",
    score: 71,
    desc: "REST conventions, versioning & error formats",
    findings: ["Inconsistent error response shapes", "No pagination on lists"],
  },
  {
    icon: Database,
    label: "Database Design",
    color: "#84cc16",
    bg: "#111e06",
    score: 65,
    desc: "Schema quality, indexes & migrations",
    findings: ["Missing soft-delete pattern", "No created_at on 3 tables"],
  },
  {
    icon: GitBranch,
    label: "DevOps / CI-CD",
    color: "#14b8a6",
    bg: "#081a18",
    score: 73,
    desc: "CI pipeline, deployment & infra as code",
    findings: ["No staging environment detected", "No linting step in CI"],
  },
  {
    icon: TrendingUp,
    label: "SaaS Maturity",
    color: "#f43f5e",
    bg: "#200812",
    score: 62,
    desc: "Monetization, analytics & multi-tenancy",
    findings: ["No subscription management UI", "Missing usage analytics"],
  },
];

const aiFeatures = [
  {
    icon: Target,
    label: "AI Roadmap Generator",
    color: "#3b82f6",
    bg: "#0f2040",
    desc: "Turn findings into a prioritized technical roadmap with sprint-ready tickets and effort estimates.",
    items: [
      "Q1: Fix critical security issues (~3 days)",
      "Q2: Add auth test coverage (~5 days)",
      "Q3: Performance sprint (~8 days)",
    ],
  },
  {
    icon: Sparkles,
    label: "Launch Readiness Score",
    color: "#8b5cf6",
    bg: "#170f20",
    desc: "Are you ready to launch? Composite score across 8 launch criteria with a detailed checklist.",
    items: [
      "Security: 7/10 ✓",
      "Error Handling: 4/10 ✗",
      "Monitoring: 3/10 ✗",
      "Performance: 8/10 ✓",
    ],
  },
  {
    icon: Network,
    label: "Competitor Analyzer",
    color: "#f97316",
    bg: "#201508",
    desc: "Compare your technical stack and SaaS maturity against competitors in your market.",
    items: [
      "vs. Competitor A: +12 pts Architecture",
      "vs. Competitor B: -8 pts Security",
      "Your edge: Superior DevOps",
    ],
  },
  {
    icon: AlertTriangle,
    label: "Technical Debt Scanner",
    color: "#f59e0b",
    bg: "#201a0f",
    desc: "Surface hidden technical debt and estimate remediation effort in developer-days and cost.",
    items: [
      "Critical debt: 3 items (~8 days)",
      "Medium debt: 12 items (~22 days)",
      "Est. total cost: ~$18,400",
    ],
  },
  {
    icon: RefreshCw,
    label: "Refactor Planner",
    color: "#22c55e",
    bg: "#0f2018",
    desc: "AI-generated refactoring plans for your most complex files, with step-by-step guidance.",
    items: [
      "UserService.ts → Split into 3 services",
      "AuthController.ts → Extract middleware",
      "database.ts → Add connection pooling",
    ],
  },
  {
    icon: TrendingUp,
    label: "Growth Advisor",
    color: "#06b6d4",
    bg: "#082020",
    desc: "Identify technical blockers to product growth and get a clear path to fix them.",
    items: [
      "Add feature flags for A/B testing",
      "Implement self-serve onboarding",
      "Build usage-limit upgrade prompts",
    ],
  },
  {
    icon: BarChart3,
    label: "Monetization Advisor",
    color: "#ec4899",
    bg: "#20081a",
    desc: "Tactical recommendations to improve revenue infrastructure and billing setup.",
    items: [
      "Add annual billing option",
      "Implement usage-based pricing tier",
      "Build upgrade flow at limits",
    ],
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
      "All 7 AI features",
      "REST API access",
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
      "Linear & Jira integration",
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

const scoreHistory = [
  { month: "Feb", score: 58 },
  { month: "Mar", score: 63 },
  { month: "Apr", score: 67 },
  { month: "May", score: 71 },
  { month: "Jun", score: 74 },
];

const exportFormats = [
  {
    icon: FileBarChart,
    name: "PDF Report",
    desc: "Full analysis with findings, scores and charts — ready to share with investors or team.",
    color: "#ef4444",
    bg: "#200f0f",
    ext: "PDF",
  },
  {
    icon: FileText,
    name: "Markdown",
    desc: "Dev-friendly format, perfect for your README, wiki, or documentation site.",
    color: "#3b82f6",
    bg: "#0f2040",
    ext: "MD",
  },
  {
    icon: FileJson,
    name: "JSON Export",
    desc: "Machine-readable format for your own tools, dashboards, and CI pipelines.",
    color: "#22c55e",
    bg: "#0f2018",
    ext: "JSON",
  },
  {
    icon: Download,
    name: "CSV Export",
    desc: "Findings spreadsheet with all severity levels, modules, and status columns.",
    color: "#f59e0b",
    bg: "#201a0f",
    ext: "CSV",
  },
];

const frameworks = [
  { name: "Next.js", color: "#f0f0f0" },
  { name: "Python", color: "#3b82f6" },
  { name: "Go", color: "#06b6d4" },
  { name: "Ruby", color: "#ef4444" },
  { name: "Rust", color: "#f97316" },
  { name: "TypeScript", color: "#3b82f6" },
  { name: "Java", color: "#f59e0b" },
  { name: "PHP", color: "#8b5cf6" },
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
              See pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            <div className="rounded-t-2xl border border-[#2a2a2a] bg-[#111111] shadow-2xl shadow-black/60">
              <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-[#ef4444]/60" />
                <div className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
                <div className="h-3 w-3 rounded-full bg-[#22c55e]/60" />
                <div className="mx-auto flex h-6 items-center rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-xs text-[#404040]">
                  ai-cto-dusky.vercel.app/projects/abc123/analysis
                </div>
              </div>
              <div className="flex h-[420px] overflow-hidden">
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
                <div className="flex-1 overflow-hidden p-6">
                  <div className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-1 text-xs text-[#606060]">SaaS Score</div>
                        <div className="flex items-end gap-1">
                          <span className="font-mono text-5xl font-bold text-[#3b82f6]">74</span>
                          <span className="mb-1 text-lg text-[#333333]">/100</span>
                        </div>
                        <div className="mt-1 text-xs text-[#f59e0b]">Nearly There</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {allModules.slice(0, 4).map((m) => (
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

      {/* Frameworks trust bar */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-6">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs text-[#404040]">
            Works with any language or framework
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {frameworks.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#111111] px-3 py-1.5"
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                <span className="text-xs text-[#707070]">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10">
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
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            How it works
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            From repo to report in 3 steps
          </h2>
          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent md:block" />
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
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

      {/* 12 Analysis Modules */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            What gets analyzed
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            12 modules. One complete picture.
          </h2>
          <p className="mb-12 text-center text-[#707070]">
            Every analysis runs all 12 modules in parallel — architecture to SaaS maturity, done in
            under 3 minutes.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allModules.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5 transition-all hover:border-[#404040]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: m.bg }}
                  >
                    <m.icon className="h-4.5 w-4.5" style={{ color: m.color }} />
                  </div>
                  <span className="font-mono text-lg font-bold" style={{ color: m.color }}>
                    {m.score}
                  </span>
                </div>
                <div className="mb-1 h-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.score}%`, backgroundColor: m.color }}
                  />
                </div>
                <h3 className="mt-3 mb-1 text-sm font-semibold text-[#f0f0f0]">{m.label}</h3>
                <p className="mb-3 text-xs leading-relaxed text-[#606060]">{m.desc}</p>
                <div className="space-y-1">
                  {m.findings.map((f) => (
                    <div key={f} className="flex items-start gap-1.5 text-xs text-[#505050]">
                      <div
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SaaS Score deep dive */}
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
                The SaaS Score combines all 12 weighted modules into a single 0–100 metric. Track
                your progress with every analysis and see exactly what to fix first.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Architecture",
                  "Security",
                  "Code Quality",
                  "Performance",
                  "Testing",
                  "Documentation",
                  "API Design",
                  "SaaS Maturity",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#3b82f6]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
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
                <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
                    style={{ width: "74%" }}
                  />
                </div>
                <div className="space-y-3">
                  {allModules.slice(0, 8).map((m) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <m.icon className="h-3.5 w-3.5 shrink-0" style={{ color: m.color }} />
                      <span className="w-28 text-xs text-[#606060]">{m.label}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                        <div
                          className="h-1.5 rounded-full"
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

      {/* 7 AI Power Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#8b5cf6]">
            AI Power Tools
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            7 AI tools beyond the analysis.
          </h2>
          <p className="mb-12 text-center text-[#707070]">
            After your analysis runs, unlock AI-powered features that turn findings into action
            plans, roadmaps, and strategic insights.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {aiFeatures.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5 transition-all hover:border-[#404040]"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-[#f0f0f0]">{f.label}</h3>
                <p className="mb-4 text-xs leading-relaxed text-[#606060]">{f.desc}</p>
                <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-3 space-y-1.5">
                  {f.items.map((item) => (
                    <div key={item} className="flex items-start gap-1.5 text-xs text-[#505050]">
                      <div
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: f.color }}
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* CTA card */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2a2a2a] p-5 text-center">
              <Zap className="mb-3 h-8 w-8 text-[#2a2a2a]" />
              <p className="mb-4 text-sm text-[#404040]">All 7 AI tools included in Pro</p>
              <Link
                href="/sign-up"
                className="rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563eb]"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Advisor */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111111] shadow-2xl shadow-black/50">
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
                    to git. I&apos;ll generate a refactored version...
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-2.5">
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

      {/* Score History / Trends */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#3b82f6]">
                Score Trends
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
                Track your progress
                <br />
                over time.
              </h2>
              <p className="mb-6 leading-relaxed text-[#707070]">
                Every analysis creates a snapshot. Watch your SaaS Score climb as you fix issues,
                compare module scores between runs, and keep your team accountable.
              </p>
              <ul className="space-y-3">
                {[
                  "Full analysis history with timestamps",
                  "Per-module score trends",
                  "Side-by-side comparison view",
                  "Team-visible progress dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#3b82f6]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Bar chart mockup */}
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-6 shadow-xl shadow-black/40">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#f0f0f0]">SaaS Score History</p>
                  <p className="text-xs text-[#606060]">my-saas-app · last 5 analyses</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                  +16 pts <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                </span>
              </div>
              <div className="flex h-40 items-end gap-3 border-b border-[#1f1f1f] pb-3">
                {scoreHistory.map((s, i) => {
                  const isLast = i === scoreHistory.length - 1;
                  const h = Math.round((s.score / 100) * 140);
                  return (
                    <div key={s.month} className="flex flex-1 flex-col items-center gap-1">
                      {isLast && (
                        <span className="mb-1 rounded bg-[#3b82f6] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {s.score}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${h}px`,
                          backgroundColor: isLast ? "#3b82f6" : "#1e3a5f",
                          border: isLast ? "1px solid #3b82f6" : "1px solid #1e2a3f",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-3">
                {scoreHistory.map((s) => (
                  <div key={s.month} className="flex-1 text-center text-[10px] text-[#404040]">
                    {s.month}
                  </div>
                ))}
              </div>
              {/* Module comparison */}
              <div className="mt-5 space-y-2 border-t border-[#1f1f1f] pt-4">
                <p className="mb-3 text-xs text-[#606060]">Module changes since last analysis</p>
                {[
                  { name: "Security", prev: 28, curr: 41, color: "#ef4444" },
                  { name: "Testing", prev: 47, curr: 54, color: "#06b6d4" },
                  { name: "Docs", prev: 41, curr: 48, color: "#ec4899" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-[#606060]">{m.name}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${m.curr}%`, backgroundColor: m.color }}
                      />
                    </div>
                    <span className="font-mono text-[#22c55e]">+{m.curr - m.prev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Finding Management */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Mockup */}
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] overflow-hidden shadow-xl shadow-black/40">
              {/* Toolbar */}
              <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-4 py-3">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 text-[#404040]" />
                  <span className="text-xs text-[#404040]">Search findings...</span>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-xs text-[#606060]">
                  <Filter className="h-3.5 w-3.5" /> Filter
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-xs text-[#606060]">
                  <Download className="h-3.5 w-3.5" /> CSV
                </div>
              </div>
              {/* Filter pills */}
              <div className="flex gap-2 border-b border-[#1f1f1f] px-4 py-2.5 overflow-x-auto">
                {[
                  { label: "All", count: 25, active: true, color: "#3b82f6" },
                  { label: "Critical", count: 3, color: "#ef4444" },
                  { label: "High", count: 7, color: "#f97316" },
                  { label: "Medium", count: 11, color: "#f59e0b" },
                  { label: "Low", count: 4, color: "#22c55e" },
                ].map((pill) => (
                  <div
                    key={pill.label}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${pill.active ? "bg-[#1e3a5f] text-[#3b82f6]" : "text-[#606060]"}`}
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: pill.color }}
                    />
                    {pill.label} <span className="text-[#404040]">({pill.count})</span>
                  </div>
                ))}
              </div>
              {/* Finding rows */}
              <div className="divide-y divide-[#1a1a1a]">
                {[
                  {
                    sev: "CRITICAL",
                    mod: "Security",
                    text: "Hardcoded API key in config.ts:14",
                    color: "#ef4444",
                  },
                  {
                    sev: "HIGH",
                    mod: "Security",
                    text: "Missing rate limiting on /api/auth",
                    color: "#f97316",
                  },
                  {
                    sev: "HIGH",
                    mod: "Architecture",
                    text: "Circular dependency detected in /lib",
                    color: "#f97316",
                  },
                  {
                    sev: "MEDIUM",
                    mod: "Testing",
                    text: "Auth flow has 0% test coverage",
                    color: "#f59e0b",
                  },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                    <span
                      className="w-14 shrink-0 font-mono text-[10px] font-semibold"
                      style={{ color: f.color }}
                    >
                      {f.sev}
                    </span>
                    <span className="w-20 shrink-0 text-xs text-[#505050]">{f.mod}</span>
                    <span className="flex-1 truncate text-xs text-[#707070]">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#f59e0b]">
                Finding Management
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
                Search, filter, and
                <br />
                act on every finding.
              </h2>
              <p className="mb-6 leading-relaxed text-[#707070]">
                All findings are searchable and filterable by severity, module, and status. Mark
                issues as resolved, dismiss false positives, or export to CSV for your team.
              </p>
              <ul className="space-y-3">
                {[
                  "Full-text search across all findings",
                  "Filter by severity, module, or status",
                  "Mark findings as resolved or dismissed",
                  "Export to CSV for spreadsheet workflows",
                  "Share findings with team members",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            Integrations
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            Fits into your existing workflow.
          </h2>
          <p className="mb-12 text-center text-[#707070]">
            Push findings directly to your project management tools. Trigger analyses from CI. Never
            leave your stack.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Linear */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a2e] text-sm font-bold text-[#5e6ad2]">
                L
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[#f0f0f0]">Linear</h3>
              <p className="mb-4 text-xs text-[#606060]">
                Auto-create issues from critical findings with priority and labels.
              </p>
              <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                  <span className="text-xs text-[#707070]">SEC-042 · Urgent</span>
                </div>
                <p className="text-xs text-[#505050]">Hardcoded API key in config.ts</p>
              </div>
            </div>
            {/* Jira */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a1a3f] text-sm font-bold text-[#0052cc]">
                J
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[#f0f0f0]">Jira</h3>
              <p className="mb-4 text-xs text-[#606060]">
                Push findings to your Jira board as tickets with severity metadata.
              </p>
              <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-[#0052cc]/20 text-center text-[8px] leading-4 text-[#0052cc]">
                    P1
                  </div>
                  <span className="text-xs text-[#707070]">PROJ-138 · Bug</span>
                </div>
                <p className="text-xs text-[#505050]">Missing rate limiting on /auth</p>
              </div>
            </div>
            {/* GitHub Webhooks */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] border border-[#2a2a2a]">
                <Webhook className="h-5 w-5 text-[#f0f0f0]" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[#f0f0f0]">GitHub Webhooks</h3>
              <p className="mb-4 text-xs text-[#606060]">
                Trigger analysis automatically on every push to your main branch.
              </p>
              <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-3 font-mono text-[10px]">
                <div className="text-[#22c55e]">● push → main</div>
                <div className="text-[#606060]">→ analysis triggered</div>
                <div className="text-[#3b82f6]">→ report ready in 2m</div>
              </div>
            </div>
            {/* GitHub Actions */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a200a]">
                <Github className="h-5 w-5 text-[#22c55e]" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[#f0f0f0]">GitHub Actions</h3>
              <p className="mb-4 text-xs text-[#606060]">
                Run analysis in CI with our official action. Fail PRs below a score threshold.
              </p>
              <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-3 font-mono text-[10px] text-[#606060]">
                <div className="text-[#f59e0b]">- uses: ai-cto/action@v1</div>
                <div className="pl-2">min-score: 70</div>
                <div className="pl-2">fail-on: critical</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API & Automation */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#06b6d4]">
                REST API & Automation
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
                Build on top of
                <br />
                AI CTO.
              </h2>
              <p className="mb-6 leading-relaxed text-[#707070]">
                Full REST API v1 lets you trigger analyses, fetch scores, and pull findings
                programmatically. Embed live score badges in your README.
              </p>
              <ul className="space-y-3">
                {[
                  "REST API with OpenAPI spec",
                  "API key management in dashboard",
                  "Per-key rate limiting",
                  "README badge (live SVG score)",
                  "Webhook events for analysis completion",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#06b6d4]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* API mockup */}
            <div className="space-y-3">
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
                <p className="mb-3 text-xs font-medium text-[#606060]">API Endpoints</p>
                {[
                  { method: "GET", path: "/v1/projects", color: "#22c55e" },
                  { method: "POST", path: "/v1/analyses", color: "#3b82f6" },
                  { method: "GET", path: "/v1/analyses/:id", color: "#22c55e" },
                  { method: "GET", path: "/v1/findings", color: "#22c55e" },
                  { method: "GET", path: "/v1/score/:projectId", color: "#22c55e" },
                ].map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center gap-3 py-1.5 border-b border-[#1a1a1a] last:border-0"
                  >
                    <span
                      className="w-10 shrink-0 font-mono text-[10px] font-bold"
                      style={{ color: ep.color }}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs text-[#707070]">{ep.path}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-4 font-mono text-[11px]">
                <div className="mb-1 text-[#606060]"># Trigger analysis via API</div>
                <div className="text-[#3b82f6]">curl -X POST \</div>
                <div className="pl-2 text-[#a0a0a0]">https://api.ai-cto.dev/v1/analyses \</div>
                <div className="pl-2 text-[#a0a0a0]">
                  -H{" "}
                  <span className="text-[#22c55e]">&quot;Authorization: Bearer ak_...&quot;</span> \
                </div>
                <div className="pl-2 text-[#a0a0a0]">
                  -d{" "}
                  <span className="text-[#f59e0b]">
                    &apos;&#123;&quot;projectId&quot;: &quot;proj_abc&quot;&#125;&apos;
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
                <p className="mb-2 text-xs text-[#606060]">README Badge</p>
                <div className="flex items-center gap-3 rounded-lg bg-[#0d0d0d] px-3 py-2">
                  <div className="flex items-center gap-0 overflow-hidden rounded text-xs font-bold">
                    <span className="bg-[#333333] px-2 py-1 text-[#a0a0a0]">SaaS Score</span>
                    <span className="bg-[#3b82f6] px-2 py-1 text-white">74 / 100</span>
                  </div>
                  <span className="text-xs text-[#404040]">live · updates on each analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Export Formats */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-[#606060]">
            Export & Share
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-[#f0f0f0]">
            Your report, your format.
          </h2>
          <p className="mb-12 text-center text-[#707070]">
            Export findings and reports in any format for your team, investors, or automated
            pipelines.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {exportFormats.map((f) => (
              <div
                key={f.name}
                className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5 transition-all hover:border-[#404040]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: f.bg }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <span
                    className="rounded border border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] font-bold"
                    style={{ color: f.color }}
                  >
                    .{f.ext}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-[#f0f0f0]">{f.name}</h3>
                <p className="text-xs leading-relaxed text-[#606060]">{f.desc}</p>
              </div>
            ))}
          </div>
          {/* Share feature */}
          <div className="mt-8 rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]">
                <Share2 className="h-6 w-6 text-[#3b82f6]" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="mb-1 font-semibold text-[#f0f0f0]">Public Share Page</h3>
                <p className="text-sm text-[#606060]">
                  Share your analysis results with a public link — no account required for viewers.
                  Great for open source projects and investor demos.
                </p>
              </div>
              <div className="shrink-0 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-2 font-mono text-xs text-[#404040]">
                ai-cto.dev/share/abc123
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Features */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#8b5cf6]">
                Team Plan
              </p>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
                Bring your whole
                <br />
                engineering team.
              </h2>
              <p className="mb-6 leading-relaxed text-[#707070]">
                Up to 10 team members share a workspace, get weekly digest emails, and can see the
                team-wide quality dashboard.
              </p>
              <ul className="space-y-3">
                {[
                  "Shared team dashboard",
                  "Up to 10 members",
                  "Weekly digest emails",
                  "Project tagging and labelling",
                  "Aggregated quality metrics",
                  "Linear & Jira for the whole team",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#8b5cf6]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:yanlizcakaan@gmail.com?subject=AI%20CTO%20Team%20Plan"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7c3aed]"
              >
                <Users className="h-4 w-4" /> Talk to us about Team
              </Link>
            </div>
            {/* Team mockup */}
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-5 shadow-xl shadow-black/40">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#f0f0f0]">Team Dashboard</p>
                <span className="text-xs text-[#606060]">4 projects</span>
              </div>
              <div className="space-y-3">
                {[
                  { repo: "main-api", score: 74, tag: "backend", color: "#3b82f6" },
                  { repo: "web-app", score: 81, tag: "frontend", color: "#22c55e" },
                  { repo: "data-pipeline", score: 58, tag: "infra", color: "#f59e0b" },
                  { repo: "mobile-sdk", score: 66, tag: "sdk", color: "#8b5cf6" },
                ].map((p) => (
                  <div
                    key={p.repo}
                    className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3"
                  >
                    <div className="h-7 w-7 rounded bg-[#1a1a1a] flex items-center justify-center">
                      <Github className="h-3.5 w-3.5 text-[#404040]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#f0f0f0]">{p.repo}</span>
                        <div className="flex items-center gap-1 rounded-full border border-[#2a2a2a] px-1.5 py-0.5">
                          <Tag className="h-2.5 w-2.5 text-[#404040]" />
                          <span className="text-[10px] text-[#404040]">{p.tag}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold" style={{ color: p.color }}>
                        {p.score}
                      </span>
                      <div className="text-[10px] text-[#404040]">/100</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[#606060]">Team average</span>
                  <span className="font-mono font-bold text-[#f0f0f0]">69.8</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
                    style={{ width: "69.8%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard & Badges */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a0f]">
                <BarChart3 className="h-6 w-6 text-[#f59e0b]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#f0f0f0]">Public Leaderboard</h3>
              <p className="mb-5 text-sm leading-relaxed text-[#707070]">
                See how your project ranks among other SaaS products. Filter by framework, category,
                or score. A viral growth engine built in.
              </p>
              <div className="space-y-2">
                {[
                  { repo: "myapp/saas-starter", score: 91 },
                  { repo: "team/main-product", score: 87 },
                  { repo: "indie/ai-tool", score: 82 },
                ].map((r, i) => (
                  <div
                    key={r.repo}
                    className="flex items-center gap-3 rounded-lg bg-[#0d0d0d] px-3 py-2.5"
                  >
                    <span className="w-5 text-center font-mono text-xs text-[#404040]">
                      #{i + 1}
                    </span>
                    <span className="flex-1 font-mono text-xs text-[#707070]">{r.repo}</span>
                    <span className="font-mono text-sm font-bold text-[#f59e0b]">{r.score}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/leaderboard"
                className="mt-5 flex items-center gap-2 text-sm text-[#3b82f6] hover:underline"
              >
                View leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#082020]">
                <Tag className="h-6 w-6 text-[#22c55e]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#f0f0f0]">Programmatic SEO Pages</h3>
              <p className="mb-5 text-sm leading-relaxed text-[#707070]">
                Every analyzed framework gets a public page with aggregated stats, findings, and
                top-scoring repos. Discover best practices in your stack.
              </p>
              <div className="space-y-2">
                {[
                  { path: "/analyze/next-js", label: "Next.js Analysis Hub", count: "143 repos" },
                  {
                    path: "/analyze/python-fastapi",
                    label: "FastAPI Analysis Hub",
                    count: "87 repos",
                  },
                  {
                    path: "/analyze/go-fiber",
                    label: "Go / Fiber Analysis Hub",
                    count: "54 repos",
                  },
                ].map((page) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between rounded-lg bg-[#0d0d0d] px-3 py-2.5"
                  >
                    <span className="text-xs text-[#707070]">{page.label}</span>
                    <span className="text-xs text-[#404040]">{page.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-[#1f1f1f] bg-[#0d0d0d] py-24">
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
                className={`relative rounded-2xl border p-6 ${plan.highlighted ? "border-[#3b82f6] bg-[#111111] shadow-lg shadow-[#3b82f6]/10" : "border-[#2a2a2a] bg-[#111111]"}`}
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
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${plan.highlighted ? "bg-[#3b82f6] text-white shadow-md shadow-[#3b82f6]/30 hover:bg-[#2563eb]" : "border border-[#2a2a2a] text-[#a0a0a0] hover:border-[#404040] hover:text-[#f0f0f0]"}`}
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
        <section className="py-24">
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
      <section className="relative overflow-hidden border-t border-[#1f1f1f] bg-[#0d0d0d] py-32">
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
