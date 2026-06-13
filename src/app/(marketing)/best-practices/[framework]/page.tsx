import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { env } from "@/env";

export const revalidate = 86400; // 24 hours

type Severity = "critical" | "high" | "medium" | "low" | "info";

const FRAMEWORKS: Record<
  string,
  {
    name: string;
    category: string;
    description: string;
    commonIssues: Array<{ title: string; severity: Severity; description: string }>;
  }
> = {
  nextjs: {
    name: "Next.js",
    category: "React Framework",
    description:
      "Common issues found in AI CTO analyses of Next.js projects, aggregated from hundreds of real codebases.",
    commonIssues: [
      {
        title: "Missing error.tsx boundary",
        severity: "high",
        description:
          "App Router pages lack error.tsx files, causing unhandled runtime errors to surface as blank screens.",
      },
      {
        title: "Oversized bundle from barrel imports",
        severity: "medium",
        description:
          "Importing from index files pulls entire modules into the client bundle instead of tree-shaking individual exports.",
      },
      {
        title: "API routes without rate limiting",
        severity: "high",
        description:
          "Next.js API routes exposed publicly without request rate limiting are vulnerable to abuse.",
      },
      {
        title: "Server Components fetching from slow APIs",
        severity: "medium",
        description:
          "Synchronous data fetches in Server Components block the entire page render without parallel fetching via Promise.all.",
      },
      {
        title: "Missing metadataBase in layout.tsx",
        severity: "low",
        description:
          "Without metadataBase, Open Graph images use relative URLs that resolve incorrectly when pages are shared.",
      },
    ],
  },
  django: {
    name: "Django",
    category: "Python Framework",
    description:
      "Aggregated findings from AI CTO analyses of Django projects — security, performance, and readiness issues.",
    commonIssues: [
      {
        title: "DEBUG=True in production settings",
        severity: "critical",
        description:
          "Django with DEBUG=True exposes full stack traces and sensitive configuration to end users on errors.",
      },
      {
        title: "Missing CSRF protection on API views",
        severity: "high",
        description:
          "DRF views using SessionAuthentication without explicit CSRF checks are vulnerable to cross-site request forgery.",
      },
      {
        title: "N+1 queries in querysets",
        severity: "medium",
        description:
          "Foreign key access inside loops without select_related() generates O(n) database queries.",
      },
      {
        title: "User-controlled input in Q() objects",
        severity: "high",
        description:
          "Passing unsanitized user input to Django ORM filter lookups can enable ORM injection attacks.",
      },
      {
        title: "No database connection pooling",
        severity: "medium",
        description:
          "Default Django database config opens a new connection per request; PgBouncer or django-db-pool reduces latency significantly under load.",
      },
    ],
  },
  rails: {
    name: "Ruby on Rails",
    category: "Ruby Framework",
    description:
      "Common issues in Rails projects found by AI CTO — covering security, performance, and SaaS readiness.",
    commonIssues: [
      {
        title: "Missing strong parameters on nested resources",
        severity: "high",
        description:
          "Nested resource controllers that don't whitelist attributes via strong parameters allow mass-assignment vulnerabilities.",
      },
      {
        title: "N+1 queries without includes",
        severity: "medium",
        description:
          "Association access in views without includes calls generates a query per record.",
      },
      {
        title: "Synchronous background jobs in web dyno",
        severity: "medium",
        description:
          "Running expensive operations synchronously in controller actions blocks the web worker and degrades throughput.",
      },
      {
        title: "secrets.yml committed to version control",
        severity: "critical",
        description:
          "API keys or database credentials stored in config/secrets.yml and committed to source control expose production secrets.",
      },
      {
        title: "Missing Rack::Attack rate limiting",
        severity: "high",
        description:
          "Authentication endpoints without Rack::Attack rules are susceptible to credential stuffing and brute-force attacks.",
      },
    ],
  },
  fastapi: {
    name: "FastAPI",
    category: "Python API Framework",
    description:
      "Aggregated findings from FastAPI project analyses — async patterns, security, and dependency management.",
    commonIssues: [
      {
        title: "Missing response_model on endpoints",
        severity: "medium",
        description:
          "FastAPI endpoints without response_model may leak internal fields or database model internals to API consumers.",
      },
      {
        title: "Blocking I/O in async route handlers",
        severity: "high",
        description:
          "Calling synchronous database drivers or file I/O inside async def route handlers blocks the event loop.",
      },
      {
        title: "JWT secret in environment without rotation plan",
        severity: "high",
        description:
          "Applications relying on a single static JWT secret with no rotation mechanism have a large blast radius if the key leaks.",
      },
      {
        title: "No request size limits",
        severity: "medium",
        description:
          "FastAPI routes accepting file uploads or large JSON payloads without body size limits are vulnerable to resource exhaustion.",
      },
      {
        title: "Alembic migrations not in CI",
        severity: "low",
        description:
          "Missing automated migration checks mean schema drift is discovered at deploy time rather than in pull requests.",
      },
    ],
  },
  express: {
    name: "Express.js",
    category: "Node.js Framework",
    description:
      "Common security and quality findings in Express.js projects from AI CTO analyses.",
    commonIssues: [
      {
        title: "Missing helmet middleware",
        severity: "high",
        description:
          "Express apps without helmet lack security headers (CSP, HSTS, X-Frame-Options) that protect against common web vulnerabilities.",
      },
      {
        title: "Unvalidated req.body passed to DB queries",
        severity: "critical",
        description:
          "User-controlled input forwarded directly to MongoDB or SQL queries without schema validation enables injection attacks.",
      },
      {
        title: "Synchronous file system calls in route handlers",
        severity: "medium",
        description:
          "Using fs.readFileSync or similar blocking APIs in route handlers blocks the Node.js event loop under concurrent requests.",
      },
      {
        title: "No centralized error handler",
        severity: "medium",
        description:
          "Missing app.use((err, req, res, next) => {}) middleware causes unhandled errors to crash the process or return 500 with stack traces.",
      },
      {
        title: "Missing CORS origin whitelist",
        severity: "high",
        description:
          "cors({ origin: '*' }) allows any domain to make credentialed requests, bypassing same-origin protections.",
      },
    ],
  },
  laravel: {
    name: "Laravel",
    category: "PHP Framework",
    description:
      "Most common issues in Laravel applications identified by AI CTO across architecture, security, and quality.",
    commonIssues: [
      {
        title: "Missing FormRequest validation classes",
        severity: "medium",
        description:
          "Inline validation in controllers instead of dedicated FormRequest classes makes rules hard to reuse and test.",
      },
      {
        title: "Eloquent relationships without eager loading",
        severity: "medium",
        description:
          "Accessing Eloquent relationships in loops without with() generates an N+1 query pattern.",
      },
      {
        title: "Sensitive data in application logs",
        severity: "high",
        description:
          "Logging full request/response payloads or exception objects that contain API keys or PII.",
      },
      {
        title: "Missing CSRF token on AJAX requests",
        severity: "high",
        description:
          "JavaScript-driven AJAX requests that modify state without the X-CSRF-TOKEN header are vulnerable to CSRF attacks.",
      },
      {
        title: "No queue worker for mail sending",
        severity: "medium",
        description:
          "Sending emails synchronously in web request handlers degrades response times and blocks on mail server availability.",
      },
    ],
  },
  nestjs: {
    name: "NestJS",
    category: "Node.js Framework",
    description:
      "Recurring patterns in AI CTO analyses of NestJS projects — dependency injection, validation, and security.",
    commonIssues: [
      {
        title: "Missing global ValidationPipe",
        severity: "high",
        description:
          "NestJS applications without a global ValidationPipe allow unvalidated data to reach service and repository layers.",
      },
      {
        title: "Circular dependency between modules",
        severity: "medium",
        description:
          "forwardRef() usage signals circular imports that create tight coupling and make module boundaries hard to maintain.",
      },
      {
        title: "Secrets in ConfigModule without validation",
        severity: "high",
        description:
          "ConfigModule without Joi or Zod schema validation allows the app to start with missing or malformed environment variables.",
      },
      {
        title: "No role-based guard on admin routes",
        severity: "critical",
        description:
          "Endpoints under /admin that rely only on JWT authentication without role checks are accessible to any authenticated user.",
      },
      {
        title: "Repository pattern skipped for Prisma",
        severity: "low",
        description:
          "Calling Prisma directly in service classes ties business logic to the ORM and makes unit testing require database mocking.",
      },
    ],
  },
  svelte: {
    name: "SvelteKit",
    category: "Svelte Framework",
    description:
      "Common findings in SvelteKit applications from AI CTO analyses — load functions, forms, and deployment patterns.",
    commonIssues: [
      {
        title: "Secrets accessed in client-side load functions",
        severity: "critical",
        description:
          "Using $env/static/private or server-only modules inside +page.svelte instead of +page.server.ts exposes secrets to the client bundle.",
      },
      {
        title: "Missing form action validation",
        severity: "high",
        description:
          "SvelteKit form actions that process POST requests without schema validation allow arbitrary data to reach the database layer.",
      },
      {
        title: "No error.svelte page",
        severity: "medium",
        description:
          "Applications without a +error.svelte page show a generic browser error instead of a branded error experience.",
      },
      {
        title: "fetch in load without caching headers",
        severity: "medium",
        description:
          "Data fetched in load functions without cache headers forces a fresh fetch on every navigation.",
      },
      {
        title: "Prisma Client imported in shared load context",
        severity: "high",
        description:
          "Importing Prisma Client in a file reachable from both server and client contexts causes build failures or leaks DB credentials.",
      },
    ],
  },
  vue: {
    name: "Vue / Nuxt",
    category: "Vue Framework",
    description:
      "Most common issues in Vue.js and Nuxt projects surfaced by AI CTO — composables, SSR, and state management.",
    commonIssues: [
      {
        title: "Reactive state mutation in Pinia outside actions",
        severity: "medium",
        description:
          "Mutating Pinia store state directly from components bypasses action logging and makes state changes untraceable in devtools.",
      },
      {
        title: "useAsyncData not awaited in setup",
        severity: "high",
        description:
          "Not awaiting useAsyncData in Nuxt setup() means the component renders before data is ready, causing hydration mismatches.",
      },
      {
        title: "Server routes without H3 validation",
        severity: "high",
        description:
          "Nuxt server routes that accept user input without readValidatedBody() allow unvalidated data to reach server logic.",
      },
      {
        title: "Large component without lazy loading",
        severity: "medium",
        description:
          "Importing heavy third-party components without defineAsyncComponent() inflates the initial bundle unnecessarily.",
      },
      {
        title: "Missing useSeoMeta on dynamic pages",
        severity: "low",
        description:
          "Dynamic pages without useSeoMeta() lack unique Open Graph and Twitter card metadata, hurting social sharing performance.",
      },
    ],
  },
  spring: {
    name: "Spring Boot",
    category: "Java Framework",
    description:
      "Aggregated findings from Spring Boot project analyses — security, dependency, and configuration issues.",
    commonIssues: [
      {
        title: "Spring Security disabled in tests leaking to prod",
        severity: "critical",
        description:
          "@SpringBootTest with security disabled via @WithMockUser or test profiles that accidentally apply to production builds.",
      },
      {
        title: "N+1 with FetchType.EAGER on collections",
        severity: "medium",
        description:
          "JPA entities with EAGER fetch type on OneToMany associations load entire child collections on every parent query.",
      },
      {
        title: "Actuator endpoints exposed without authentication",
        severity: "critical",
        description:
          "/actuator/env and /actuator/health endpoints reachable without authentication expose application configuration and health state.",
      },
      {
        title: "application.properties secrets committed",
        severity: "critical",
        description:
          "Database passwords or API keys in application.properties committed to version control expose production credentials.",
      },
      {
        title: "Missing @Transactional on service layer",
        severity: "medium",
        description:
          "Multi-step database operations without @Transactional can leave data in inconsistent state if one step fails.",
      },
    ],
  },
};

const SLUG_LIST = Object.keys(FRAMEWORKS);

export async function generateStaticParams() {
  return SLUG_LIST.map((framework) => ({ framework }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ framework: string }>;
}): Promise<Metadata> {
  const { framework } = await params;
  const fw = FRAMEWORKS[framework];
  if (!fw) return { title: "Not Found — AI CTO" };

  const title = `${fw.name} Best Practices & Common Issues — AI CTO`;
  const description = fw.description;
  return {
    title,
    description,
    alternates: { canonical: `${env.NEXT_PUBLIC_APP_URL}/best-practices/${framework}` },
    openGraph: { title, description },
  };
}

async function getRecentAnalyses(framework: string) {
  return db.project.findMany({
    where: {
      framework: { contains: FRAMEWORKS[framework]?.name ?? framework, mode: "insensitive" },
      isPrivate: false,
      status: "active",
      analyses: { some: { status: "complete", isPublic: true } },
    },
    select: {
      githubOwner: true,
      githubRepo: true,
      latestScore: true,
    },
    orderBy: { latestScore: "desc" },
    take: 6,
  });
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

export default async function FrameworkPage({
  params,
}: {
  params: Promise<{ framework: string }>;
}) {
  const { framework } = await params;
  const fw = FRAMEWORKS[framework];
  if (!fw) notFound();

  const examples = await getRecentAnalyses(framework);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-xs text-[#606060]">
          <Link href="/leaderboard" className="hover:text-[#a0a0a0]">
            Leaderboard
          </Link>
          <span>/</span>
          <span>Best Practices</span>
          <span>/</span>
          <span className="text-[#a0a0a0]">{fw.name}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <span className="mb-2 inline-block rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-xs text-[#a0a0a0]">
            {fw.category}
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f0f0f0]">
            {fw.name} — Common Issues & Best Practices
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#a0a0a0]">{fw.description}</p>
        </div>

        {/* Common issues */}
        <div className="mb-12">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#606060]">
            Top Issues Found
          </h2>
          <div className="space-y-4">
            {fw.commonIssues.map((issue) => (
              <div
                key={issue.title}
                className="flex gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-5"
              >
                <div
                  className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOR[issue.severity] }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#f0f0f0]">{issue.title}</p>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        color: SEVERITY_COLOR[issue.severity],
                        backgroundColor: `${SEVERITY_COLOR[issue.severity]}18`,
                      }}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#a0a0a0]">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real examples from the leaderboard */}
        {examples.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#606060]">
              Real {fw.name} Projects on the Leaderboard
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {examples.map((p) => {
                if (!p.githubOwner || !p.githubRepo) return null;
                const score = p.latestScore;
                const color =
                  score == null
                    ? "#606060"
                    : score >= 80
                      ? "#22c55e"
                      : score >= 65
                        ? "#3b82f6"
                        : score >= 50
                          ? "#f59e0b"
                          : score >= 35
                            ? "#f97316"
                            : "#ef4444";
                return (
                  <Link
                    key={`${p.githubOwner}/${p.githubRepo}`}
                    href={`/explore/${p.githubOwner}/${p.githubRepo}`}
                    className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 transition-colors hover:border-[#404040]"
                  >
                    <p className="truncate text-sm font-medium text-[#f0f0f0]">
                      {p.githubOwner}/{p.githubRepo}
                    </p>
                    {score != null && (
                      <p className="mt-1 text-xs tabular-nums" style={{ color }}>
                        Score: {score}/100
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Explore all frameworks */}
        <div className="mb-10">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#606060]">
            More Frameworks
          </h2>
          <div className="flex flex-wrap gap-2">
            {SLUG_LIST.filter((s) => s !== framework).map((s) => (
              <Link
                key={s}
                href={`/best-practices/${s}`}
                className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
              >
                {FRAMEWORKS[s]?.name}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-base font-semibold text-[#f0f0f0]">Analyze your {fw.name} project</p>
          <p className="mt-2 text-sm text-[#a0a0a0]">
            Get a full AI CTO report — architecture, security, code quality, and SaaS readiness
            scored in minutes.
          </p>
          <Link
            href="/sign-up"
            className="mt-5 inline-block rounded-md bg-[#3b82f6] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
          >
            Analyze your repo for free
          </Link>
        </div>
      </div>
    </div>
  );
}
