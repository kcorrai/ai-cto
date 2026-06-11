# Architecture

## System Overview

AI CTO is a Next.js full-stack application deployed on Vercel, with async AI analysis jobs powered by Vercel Queues and Fluid Compute. The architecture is designed for low operational overhead, fast time-to-value for users, and the ability to scale analysis throughput independently of the web layer.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                        │
│                     Next.js App Router + React                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────┐
│                    Vercel Edge Network (CDN)                      │
│              Static assets, edge caching, routing                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                  Next.js Application (Vercel)                     │
│                                                                   │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐ │
│  │    App Router        │    │          API Routes               │ │
│  │   (Server/Client)    │    │  /api/auth, /api/projects,        │ │
│  │                      │    │  /api/analyses, /api/reports,     │ │
│  │  - Dashboard         │    │  /api/webhooks, /api/ai-chat      │ │
│  │  - Analysis Views    │    └──────────────────────────────────┘ │
│  │  - Reports           │                                         │
│  │  - AI Chat           │    ┌──────────────────────────────────┐ │
│  │  - Settings          │    │      Middleware (Clerk Auth)       │ │
│  └─────────────────────┘    └──────────────────────────────────┘ │
└──────────┬─────────────────────────────┬──────────────────────────┘
           │                             │
┌──────────▼──────────┐     ┌────────────▼────────────────────────┐
│   Vercel Queues      │     │         External Services            │
│                      │     │                                       │
│  Analysis Job Queue  │     │  - Clerk (Authentication)            │
│  Report Gen Queue    │     │  - Stripe (Payments)                 │
│  Notification Queue  │     │  - GitHub API (Repository access)    │
│                      │     │  - Resend (Email)                    │
└──────────┬──────────┘     │  - Vercel AI Gateway (LLM access)   │
           │                 └──────────────────────────────────────┘
┌──────────▼──────────┐
│  Analysis Workers    │
│  (Vercel Functions)  │
│                      │
│  - Repo fetcher      │
│  - Code analyzer     │
│  - AI orchestrator   │
│  - Report generator  │
└──────────┬──────────┘
           │
┌──────────▼─────────────────────────────────────────────────────┐
│                        Data Layer                                 │
│                                                                   │
│  ┌──────────────────┐   ┌─────────────────┐   ┌──────────────┐ │
│  │   Neon Postgres   │   │  Upstash Redis   │   │ Vercel Blob  │ │
│  │                   │   │                  │   │              │ │
│  │  - Users          │   │  - Session cache │   │  - Reports   │ │
│  │  - Projects       │   │  - Rate limits   │   │  - Exports   │ │
│  │  - Analyses       │   │  - Analysis lock │   │  - Uploads   │ │
│  │  - Reports        │   │  - Job dedup     │   │              │ │
│  │  - Subscriptions  │   │  - Query cache   │   │              │ │
│  └──────────────────┘   └─────────────────┘   └──────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Layer-by-Layer Breakdown

### 1. Frontend Layer

**Technology:** Next.js 15 App Router with React 19

**Structure:**

- **Server Components** for data-heavy pages (dashboards, reports)
- **Client Components** for interactive elements (AI Chat, real-time progress)
- **Streaming** with React Suspense for progressive loading of analysis results
- **Server Actions** for form submissions and mutations

**Routing:**

```
app/
├── (marketing)/          # Public marketing pages
│   ├── page.tsx          # Landing page
│   ├── pricing/
│   └── blog/
├── (auth)/               # Auth pages (Clerk)
│   ├── sign-in/
│   └── sign-up/
├── (app)/                # Protected application
│   ├── dashboard/        # Main dashboard
│   ├── projects/
│   │   ├── new/
│   │   └── [id]/
│   │       ├── overview/
│   │       ├── analysis/
│   │       ├── advisor/   # AI Chat
│   │       └── reports/
│   └── settings/
└── api/                  # API routes
```

### 2. API Layer

**Pattern:** Next.js Route Handlers under `/app/api/`

**Key API Groups:**

- `/api/auth/*` — Clerk webhooks for user sync
- `/api/projects/*` — Project CRUD and GitHub connection
- `/api/analyses/*` — Trigger and retrieve analyses
- `/api/advisor/*` — AI Chat streaming endpoint
- `/api/reports/*` — Report generation and export
- `/api/webhooks/stripe` — Stripe billing webhooks
- `/api/webhooks/github` — GitHub push events (for re-analysis triggers)

**API Standards:**

- All routes return `{ data, error, meta }` envelope
- Zod validation on all inputs
- Rate limiting via Upstash Redis
- Authentication via Clerk middleware

### 3. Analysis Pipeline

The core differentiator. Runs asynchronously via Vercel Queues.

**Pipeline Stages:**

```
Trigger → Queue → Fetch → Analyze → Synthesize → Store → Notify
```

**Stage 1: Repository Fetch**

- Connect to GitHub API via user's OAuth token
- Fetch repository metadata (languages, size, contributors, activity)
- Fetch file tree
- Intelligently sample files based on size and type
- Store fetched content in Vercel Blob temporarily

**Stage 2: Pre-Analysis**

- Language detection
- Framework detection
- Dependency graph construction
- File classification (source, test, config, docs)

**Stage 3: Module Analysis**
Each module runs independently and can be parallelized:

- Architecture Module
- Code Quality Module
- Security Module
- Performance Module
- Testing Coverage Module
- Documentation Module
- Dependencies Module
- API Design Module
- Database Module
- DevOps/CI Module
- Product Readiness Module
- SaaS Maturity Module

**Stage 4: Synthesis**

- Aggregate all module outputs
- Generate prioritized findings list
- Calculate SaaS Score (0–100)
- Generate executive summary
- Generate actionable recommendations

**Stage 5: Report Generation**

- Store structured report in database
- Generate PDF/Markdown exports to Vercel Blob
- Trigger notification (email + in-app)

### 4. AI Layer

**Provider:** Anthropic Claude via Vercel AI Gateway

**Model Selection Strategy:**

- `claude-opus-4-8` — Deep analysis, synthesis, strategic recommendations
- `claude-sonnet-4-6` — Module-level analysis, faster processing
- `claude-haiku-4-5-20251001` — Quick classifications, metadata extraction, chat responses

**Context Management:**

- Each module receives a focused context window (relevant files + metadata)
- Cross-module synthesis runs after all modules complete
- Analysis results are structured via Zod schemas before storage
- Prompt templates are versioned and stored in codebase

**Streaming:**

- AI Chat advisor uses streaming responses via Vercel AI SDK
- Analysis progress is streamed to the client via Server-Sent Events

### 5. Data Layer

**Primary Database: Neon PostgreSQL**

- Provisioned via Vercel Marketplace
- Prisma ORM for type-safe queries
- Connection pooling via Neon's built-in pooler
- Read replicas for report queries (future)

**Cache: Upstash Redis**

- Provisioned via Vercel Marketplace
- Session caching
- Rate limiting (sliding window per user/IP)
- Analysis job deduplication (prevent double-triggering)
- Frequently accessed project metadata

**File Storage: Vercel Blob**

- Temporary repository content during analysis
- Generated PDF reports
- Exported Markdown/JSON files
- User-uploaded project archives (non-GitHub path)

---

## Security Architecture

See `security.md` for full details.

**Summary:**

- Authentication: Clerk (JWT-based)
- Authorization: Row-level security in Postgres + middleware checks
- GitHub tokens: Encrypted at rest using AES-256, decrypted only in worker context
- All analysis runs in isolated Vercel Function instances
- No user code is persisted beyond the analysis window (configurable)
- Audit logging for all sensitive operations

---

## Scalability Considerations

### Analysis Throughput

- Vercel Queues handles burst capacity automatically
- Analysis workers are stateless and horizontally scalable
- Per-user concurrency limits enforced via Redis locks

### Database

- Neon auto-scales compute
- Indexes on all foreign keys and common query patterns
- Heavy reports stored as JSON blobs, not normalized rows
- Archival job for analyses older than retention limit

### AI Rate Limits

- Per-user daily token budgets enforced before job submission
- Queue priority tiers (Enterprise > Team > Pro > Free)
- Fallback to cheaper models during peak load

---

## Disaster Recovery

| Component       | Recovery Strategy                               |
| --------------- | ----------------------------------------------- |
| Database (Neon) | Daily automated backups, point-in-time recovery |
| Blob storage    | Vercel Blob replication                         |
| Queues          | At-least-once delivery, idempotent job handlers |
| Application     | Instant rollback via Vercel deployment history  |

---

## Environments

| Environment | Purpose                | Deployment                     |
| ----------- | ---------------------- | ------------------------------ |
| Local       | Development            | `next dev`                     |
| Preview     | PR review, QA          | Auto-deployed per PR by Vercel |
| Staging     | Pre-release validation | Manual deploy of main branch   |
| Production  | Live users             | Manual promote from staging    |

Environment variables managed via Vercel project settings and `vercel env pull`.
