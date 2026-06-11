# Tech Stack

## Decision Philosophy

Every technology choice must satisfy:

1. **Productivity**: Maximizes velocity for a small team
2. **Reliability**: Battle-tested in production at scale
3. **Ecosystem fit**: Works well with the rest of the stack
4. **Cost efficiency**: Pay-as-you-scale pricing where possible
5. **Vercel-native preference**: Leverage the deployment platform's native integrations

---

## Frontend

### Framework: Next.js 15 (App Router)

**Why:** Full-stack React with built-in routing, server components, streaming, server actions, and API routes. The App Router's server component model is ideal for data-heavy analysis pages. Deployed natively on Vercel with zero config.

**Key features used:**

- Server Components for data fetching
- Client Components for interactive UI
- Server Actions for mutations
- Streaming with React Suspense
- Partial Pre-Rendering (PPR) for optimal LCP

### Language: TypeScript 5.x

**Why:** Type safety across the full stack. Shared types between frontend and backend. Non-negotiable for a product handling complex data structures.

**Config:** Strict mode enabled. No `any`. No `ts-ignore` without documented justification.

### Styling: Tailwind CSS v4

**Why:** Utility-first, consistent design tokens, excellent dark mode support, tiny bundle. v4 provides native CSS cascade layers and faster build times.

### UI Components: shadcn/ui

**Why:** Copy-paste components with full source ownership. Built on Radix UI primitives (accessibility). Tailwind-native. Easily customized to match premium design aesthetic.

**Customization approach:** All shadcn components are customized to match AI CTO design system. No component is used in its default state.

### Animation: Framer Motion

**Why:** Production-quality animations with a great developer API. Used for page transitions, component reveals, chart animations, and micro-interactions.

### Icons: Lucide React

**Why:** Consistent, clean icon set. Tree-shakeable. Used across shadcn/ui.

### Fonts

- **Display / UI**: Geist (Vercel's typeface — clean, modern, excellent legibility)
- **Monospace**: Geist Mono (code snippets, file paths, technical content)

---

## Backend

### Runtime: Node.js 24 LTS on Vercel Fluid Compute

**Why:** Full Node.js compatibility. No edge-runtime limitations. Reuses function instances across concurrent requests, reducing cold starts.

### API: Next.js Route Handlers

**Why:** Co-located with the application. Type-safe with TypeScript. No separate server to deploy or manage.

### Validation: Zod

**Why:** Runtime type validation that mirrors TypeScript types. Used for API input validation, AI output parsing, and environment variable validation.

### ORM: Prisma

**Why:** Type-safe database client generated from schema. Excellent migration tooling. First-class Postgres support. Works perfectly with Neon.

### Queue: Vercel Queues

**Why:** Native Vercel product. At-least-once delivery. Built on Fluid Compute. Zero infrastructure to manage. Perfect for async analysis jobs.

---

## Database

### Primary: Neon PostgreSQL

**Why:** Serverless Postgres with auto-scaling, connection pooling, and instant provisioning. Available via Vercel Marketplace. Branching for development/staging. Pay-per-use pricing.

**Connection:** Via Neon's connection pooler for serverless (PgBouncer-compatible)

### Cache: Upstash Redis

**Why:** Serverless Redis with per-request pricing. Available via Vercel Marketplace. Used for rate limiting, session caching, job deduplication, and hot data.

**Libraries:** `@upstash/redis`, `@upstash/ratelimit`

### File Storage: Vercel Blob

**Why:** Native Vercel product. Simple API. Used for analysis artifacts, exported reports, and temporary repository content.

---

## Authentication

### Provider: Clerk

**Why:** The most complete auth product available. Native Vercel Marketplace integration. Handles JWT, sessions, OAuth, MFA, organizations, and user management UI out of the box. Available via Vercel Marketplace with automatic environment variable provisioning.

**Features used:**

- GitHub OAuth (primary sign-in method)
- Google OAuth
- Email/password
- Organizations (for Team tier)
- Webhooks (for user sync to database)
- `<UserButton>` and `<SignIn>` components

---

## Payments

### Provider: Stripe

**Why:** Industry standard. Best API design. Handles subscriptions, usage metering, invoicing, tax, dunning, and the customer portal.

**Features used:**

- Stripe Billing (subscriptions)
- Stripe Billing Meters (usage overages)
- Stripe Customer Portal (self-serve)
- Stripe Tax (global tax compliance)
- Stripe Invoicing (Enterprise invoicing)
- Stripe Webhooks (event processing)

**Library:** `stripe` (Node.js SDK), `@stripe/stripe-js` (client)

---

## AI / LLM

### Gateway: Vercel AI Gateway

**Why:** Unified API for multiple AI providers. Observability, cost tracking, model fallbacks, zero data retention. Native to Vercel deployment.

### Primary Model: Claude claude-opus-4-8 (Anthropic)

**Why:** Best-in-class reasoning and code understanding. Appropriate for deep architectural analysis and strategic synthesis.

### Secondary Model: Claude claude-sonnet-4-6

**Why:** Faster, cheaper than Opus. Used for module-level analysis where depth is less critical than speed.

### Fast Model: Claude claude-haiku-4-5-20251001

**Why:** Sub-second latency. Used for quick classifications, metadata extraction, and low-complexity chat responses.

### SDK: Vercel AI SDK v6

**Why:** Native streaming, structured output generation, tool use, and multi-step agent support. Works natively with Next.js.

**Key features used:**

- `streamText` for AI chat streaming
- `generateObject` for structured analysis output (Zod schemas)
- `generateText` for batch analysis
- Tool use for multi-step analysis agents

---

## Email

### Provider: Resend

**Why:** Developer-first email API with excellent deliverability. React Email for templating. Simple pricing.

**Library:** `resend`, `@react-email/components`

**Use cases:**

- Welcome email
- Analysis complete notification
- Weekly digest report
- Trial expiration warnings
- Billing notifications

---

## Monitoring and Observability

### Error Tracking: Sentry

**Why:** Industry standard. Excellent Next.js integration. Source maps in production.

### Analytics: PostHog

**Why:** Open-source, self-hostable option. Product analytics (funnels, session replay, feature flags, A/B testing). Privacy-respecting.

### Logging: Vercel Log Drains → Axiom

**Why:** Axiom provides structured log querying with generous free tier. Vercel Log Drains forward all function logs automatically.

### Performance: Vercel Speed Insights + Web Analytics

**Why:** Zero-config, privacy-first, native Vercel integration.

### Uptime: Vercel's built-in monitoring

**Why:** Native to Vercel deployment. No additional setup.

---

## Development Tools

### Package Manager: pnpm

**Why:** Faster than npm, more efficient disk usage than npm/yarn. Monorepo support for future.

### Linter: ESLint (Flat Config)

**Why:** Standard for TypeScript/React projects. Custom rules for project conventions.

### Formatter: Prettier

**Why:** Zero-config formatting. No style debates.

### Git Hooks: Husky + lint-staged

**Why:** Enforce formatting and linting on commit. Prevent bad code from entering the repo.

### Commit Convention: Conventional Commits

**Why:** Enables automated changelog generation and semantic versioning.

### Testing: Vitest + Playwright

- **Vitest**: Unit and integration tests (faster than Jest, native TypeScript)
- **Playwright**: End-to-end tests for critical user flows

### CI/CD: Vercel (GitHub integration)

**Why:** Automatic preview deployments per PR. Production deploys on merge to main.

---

## Third-Party Integrations

| Integration          | Purpose                  | Priority    |
| -------------------- | ------------------------ | ----------- |
| GitHub API (Octokit) | Repository access        | Launch      |
| Linear API           | Push tasks from findings | Post-launch |
| Slack API            | Notifications            | Post-launch |
| Notion API           | Export reports           | Post-launch |
| Discord Webhooks     | Community notifications  | Post-launch |

---

## Stack Summary Table

| Layer      | Technology          | Version |
| ---------- | ------------------- | ------- |
| Framework  | Next.js             | 15.x    |
| Language   | TypeScript          | 5.x     |
| Styling    | Tailwind CSS        | 4.x     |
| Components | shadcn/ui           | Latest  |
| Animation  | Framer Motion       | 12.x    |
| ORM        | Prisma              | 6.x     |
| Database   | Neon Postgres       | Latest  |
| Cache      | Upstash Redis       | Latest  |
| Storage    | Vercel Blob         | Latest  |
| Auth       | Clerk               | Latest  |
| Payments   | Stripe              | Latest  |
| AI Gateway | Vercel AI Gateway   | Latest  |
| AI SDK     | Vercel AI SDK       | v6      |
| Queue      | Vercel Queues       | Latest  |
| Email      | Resend              | Latest  |
| Monitoring | Sentry              | Latest  |
| Analytics  | PostHog             | Latest  |
| Testing    | Vitest + Playwright | Latest  |
| Deployment | Vercel              | —       |
