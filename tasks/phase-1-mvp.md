# Phase 1 — MVP Tasks

## TASK-001: Project Scaffolding and Repository Setup

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Initialize the Next.js project with all required tooling and configuration.

### Requirements

- Next.js 15 with App Router, TypeScript strict mode
- Tailwind CSS v4 configured
- shadcn/ui initialized with custom theme (dark mode default)
- ESLint flat config with TypeScript and React rules
- Prettier with project configuration
- Husky + lint-staged for pre-commit hooks
- pnpm as package manager
- Conventional commits enforced
- `.env.example` with all required variable names
- `src/env.ts` Zod-validated environment schema
- Basic `README.md` with setup instructions

### Implementation Notes

- Use `pnpm create next-app@latest` with TypeScript, Tailwind, App Router, src dir
- Add `"strict": true` plus extra strict options to tsconfig
- Initialize shadcn: `pnpm dlx shadcn@latest init`
- Set up dark theme as CSS variables in `globals.css`
- Add Geist and Geist Mono fonts via `next/font/google`

### Dependencies

- None (first task)

### Acceptance Criteria

- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` completes without errors
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with zero warnings
- [ ] Dark mode renders correctly
- [ ] All environment variables validated on startup

---

## TASK-002: Environment Configuration and Validation

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Create a bulletproof environment variable system that fails fast and clearly.

### Requirements

- `src/env.ts` — Zod schema for all environment variables
- Separate schemas for `server` and `client` variables
- Clear error messages when variables are missing
- Type-safe access throughout the codebase
- `.env.example` listing all required variables

### Implementation Notes

- Use `@t3-oss/env-nextjs` for the type-safe env validation pattern
- Create `src/env.ts` with schemas for:
  - DATABASE_URL
  - DIRECT_URL (Neon direct connection)
  - CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
  - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - BLOB_READ_WRITE_TOKEN
  - AI_GATEWAY_URL (Vercel AI Gateway)
  - RESEND_API_KEY
  - ENCRYPTION_KEY (32-byte hex for token encryption)

### Dependencies

- TASK-001

### Acceptance Criteria

- [ ] App crashes with clear message on missing variable
- [ ] `env.ts` validates all values (not just presence)
- [ ] No direct `process.env` access outside `env.ts`
- [ ] `.env.example` is complete and documented

---

## TASK-003: Database Schema and Prisma Setup

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Set up Neon PostgreSQL via Vercel Marketplace, configure Prisma, and create the initial schema.

### Requirements

- Neon database provisioned via Vercel Marketplace integration
- Prisma schema reflecting `database-schema.md` (MVP tables only)
- Prisma client configured for Neon connection pooler
- Initial migration created and applied
- Seed script for development data
- `src/lib/db/index.ts` — singleton Prisma client

### MVP Tables

- users
- subscriptions
- projects
- analyses
- analysis_modules
- findings

### Implementation Notes

- Use Neon's connection pooler URL for Prisma datasource
- Use direct URL for migrations only (`directUrl` in schema)
- Add `prisma generate` to postinstall script
- Prisma client singleton pattern to avoid hot-reload issues in development
- Install `prisma` and `@prisma/client`

### Dependencies

- TASK-001, TASK-002

### Acceptance Criteria

- [ ] `pnpm prisma migrate dev` runs successfully
- [ ] `pnpm prisma studio` opens and shows tables
- [ ] Seed script creates test user and test project
- [ ] TypeScript types are generated and usable
- [ ] Singleton client works in both server components and route handlers

---

## TASK-004: Clerk Authentication Integration

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Integrate Clerk for authentication with GitHub and Google OAuth.

### Requirements

- Clerk provisioned via Vercel Marketplace
- `middleware.ts` protecting all `/app/*` routes
- Clerk webhook to sync users to database on sign-up and profile update
- `src/lib/auth.ts` — wrapper helpers for `auth()` and `currentUser()`
- Sign-in page (`/sign-in`) and sign-up page (`/sign-up`)
- `<UserButton>` in application header

### Implementation Notes

- Install `@clerk/nextjs`
- Configure `middleware.ts` with `clerkMiddleware` and route matcher
- Create webhook handler at `/api/webhooks/clerk`:
  - `user.created` → create user record in database
  - `user.updated` → update user record in database
  - `user.deleted` → soft-delete user record
- Verify Clerk webhook signature via `svix`

### Dependencies

- TASK-001, TASK-002, TASK-003

### Acceptance Criteria

- [ ] GitHub OAuth sign-in works end-to-end
- [ ] User record created in database after first sign-in
- [ ] Protected routes redirect unauthenticated users to sign-in
- [ ] UserButton shows correct user avatar and name
- [ ] Webhook signature verification works

---

## TASK-005: Marketing Landing Page

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Create a premium, conversion-optimized landing page that clearly communicates the product value proposition.

### Requirements

- Hero section with headline, subheadline, and CTA
- "How it works" section (3 steps)
- Feature highlights section (6 key features)
- SaaS Score demo/preview
- Social proof section (beta user testimonials)
- Pricing section (link to pricing page)
- Footer with links
- `og:image` meta tags for social sharing
- Performance: LCP < 2.5s

### Design Requirements

- Dark background (#0a0a0a)
- Prominent, confident headline
- Subtle grid or texture background
- Feature icons (Lucide)
- Animated score counter in hero

### Copy

**Headline:** "Your AI Technical Co-Founder"
**Subheadline:** "AI CTO analyzes your GitHub repository like a senior CTO. Architecture. Security. Growth potential. In minutes."
**CTA:** "Analyze Your Repo — Free"

### Dependencies

- TASK-001, TASK-004 (auth for CTA)

### Acceptance Criteria

- [ ] Page scores 90+ on Lighthouse
- [ ] CTA links to GitHub sign-up correctly
- [ ] Mobile responsive (320px–1920px)
- [ ] Dark mode renders correctly
- [ ] OG image is set and renders on Twitter/LinkedIn preview

---

## TASK-006: Application Shell and Navigation Layout

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create the main application layout with sidebar navigation and top bar.

### Requirements

- Sidebar: 240px, dark surface background
- Navigation items: Dashboard, Projects, Settings
- Top bar: 48px, page title, user menu (Clerk UserButton)
- Mobile: collapsible sidebar with hamburger
- Active route highlighting
- Breadcrumb on inner pages
- Project-context sidebar section (when viewing a project)

### Implementation Notes

- Create `app/(app)/layout.tsx` with sidebar + main content area
- Use CSS Grid for layout (`240px 1fr` / `48px 1fr`)
- Sidebar navigation items: icons + labels, keyboard accessible
- Project sidebar section added dynamically when route is under `/projects/[id]`

### Dependencies

- TASK-001, TASK-004, TASK-005

### Acceptance Criteria

- [ ] Sidebar renders on all app pages
- [ ] Active navigation item is highlighted
- [ ] Mobile layout works with collapsible sidebar
- [ ] Keyboard navigation works (Tab, Enter, Escape)

---

## TASK-007: GitHub OAuth Connection Flow

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to connect their GitHub account to AI CTO and grant repository access.

### Requirements

- "Connect GitHub" button in settings and onboarding
- GitHub OAuth App configured (separate from Clerk's GitHub sign-in)
- OAuth flow: redirect to GitHub → callback → exchange code for token → encrypt → store
- Token stored encrypted in `users.githubAccessToken`
- Connection status shown in settings
- "Disconnect GitHub" option with token deletion
- Handle: token expiry, scope insufficient, connection revoked

### Implementation Notes

- Create `/api/auth/github/connect` — initiates OAuth with state parameter
- Create `/api/auth/github/callback` — handles callback, exchanges code, stores token
- Use `state` parameter to prevent CSRF
- Requested scope: `repo` for Pro users, `public_repo` for free users
- Encrypt token with AES-256-GCM before storing (see `lib/crypto.ts`)
- Test with both public and private repositories

### Dependencies

- TASK-003, TASK-004

### Acceptance Criteria

- [ ] User can connect GitHub via OAuth
- [ ] Token is encrypted before database storage
- [ ] User can disconnect GitHub (token deleted)
- [ ] Connection status is accurately reflected in UI
- [ ] Invalid/expired token shows clear reconnect prompt

---

## TASK-008: GitHub Repository Browser

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to browse and search their GitHub repositories when creating a project.

### Requirements

- Fetch user's GitHub repositories via Octokit
- Display repos with: name, visibility, language, last updated
- Search/filter by name
- Sort by: last updated (default), name, stars
- Show personal repos and organization repos separately
- Handle empty state (no repos)
- Handle pagination for users with many repos

### Implementation Notes

- Use `@octokit/rest` with the user's stored GitHub token
- Fetch `/user/repos` and `/user/orgs` then `/orgs/{org}/repos`
- Cache repo list for 5 minutes in Redis to avoid rate limits
- Display language with a color dot (GitHub language colors)

### Dependencies

- TASK-007

### Acceptance Criteria

- [ ] Repos load within 3 seconds
- [ ] Search filters repos in real-time
- [ ] Both personal and org repos are shown
- [ ] Empty state shown if no repos
- [ ] Error state shown if GitHub token is invalid

---

## TASK-009: Project Creation Flow

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to create a project from a selected GitHub repository.

### Requirements

- Multi-step creation: Select repo → Configure → Create
- Step 1: Repository browser (TASK-008)
- Step 2: Configuration: project name (auto-filled from repo), branch selection
- Step 3: Success + trigger first analysis
- Project slug auto-generated from name (unique per user)
- Validate: not already connected, within plan limits
- Navigate to project view after creation

### Implementation Notes

- Server Action for project creation
- Validate plan limits before creating (free: 1 project max)
- Paywall if at limit: show upgrade prompt
- Auto-trigger initial analysis on project creation

### Dependencies

- TASK-007, TASK-008, TASK-003

### Acceptance Criteria

- [ ] Full creation flow completes in <30 seconds
- [ ] Duplicate repo connection is prevented
- [ ] Free tier limit is enforced (paywall shown)
- [ ] First analysis is auto-triggered on creation
- [ ] User lands on project view with analysis running

---

## TASK-010: Repository Fetcher Service

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Build the service that fetches repository content from GitHub for analysis.

### Requirements

- Fetch repository metadata (language, size, default branch, topics)
- Fetch full file tree (recursive)
- Implement intelligent file sampling strategy
- Fetch file contents for selected files
- Store content bundle in Vercel Blob (temporary)
- Handle large repos (>10k files) gracefully
- Track token usage per fetch

### Implementation Notes

- Use GitHub API: `/repos/{owner}/{repo}/git/trees/{sha}?recursive=1`
- File selection priority (see `ai-system-design.md`):
  1. Entry points (index.ts, app.ts, server.ts, main.py)
  2. Configuration files (package.json, next.config.ts, .env.example)
  3. Core domain models
  4. Key business logic files
  5. Test files (sample)
  6. README and docs
- Maximum files fetched: 100 (sampled from priority order)
- Maximum file size: 50KB per file
- Blob storage: `analyses/{analysisId}/repo-bundle.json`
- Clean up Blob after analysis completes

### Dependencies

- TASK-007, TASK-003

### Acceptance Criteria

- [ ] Fetches content for a 50-file project in <15 seconds
- [ ] Large repos (>10k files) are handled with sampling
- [ ] Bundle stored correctly in Vercel Blob
- [ ] Blob deleted after analysis completes
- [ ] Empty or binary-only repos handled gracefully

---

## TASK-011: Analysis Job Queue Setup

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Set up Vercel Queues for async analysis job processing.

### Requirements

- Queue configured in Vercel project
- Job producer: creates analysis record, publishes to queue
- Job consumer: Vercel Function that processes the analysis
- Job deduplication: prevent double-analysis of same project
- Status updates: analysis record updated as pipeline progresses
- Retry logic: infrastructure failures retried, logic failures not
- Dead letter handling: failed jobs after 3 retries stored for investigation

### Implementation Notes

- Create queue: `analysis-jobs`
- Producer: `/api/analyses/trigger/route.ts`
- Consumer: `/api/queues/analysis/route.ts`
- Use Upstash Redis for deduplication lock (key: `analysis:lock:{projectId}`, TTL: 10 min)
- Update `analyses.status` and `analyses.progress` as each stage completes
- Send progress via Server-Sent Events to the client

### Dependencies

- TASK-003, TASK-010

### Acceptance Criteria

- [ ] Analysis job is processed asynchronously
- [ ] Status updates appear in real-time on the client
- [ ] Double-trigger is prevented by deduplication lock
- [ ] Infrastructure failures are retried up to 3 times
- [ ] Analysis marked as failed if >5 minute timeout

---

## TASK-012: Architecture Analysis Module

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Implement the Architecture analysis module.

### Requirements

- Receives repository bundle from fetcher
- Analyzes folder structure and naming patterns
- Detects architectural patterns (MVC, layered, event-driven, etc.)
- Evaluates separation of concerns
- Identifies circular dependencies (where detectable)
- Produces structured findings with severity, description, and recommendation
- Scores the architecture 0–100
- Uses Vercel AI SDK `generateObject` with Zod schema

### Prompt Requirements

- Specific, non-generic findings
- Reference actual file paths from the input
- Distinguish between architectural patterns and bugs
- Evaluate appropriateness for project stage

### Output Schema

```typescript
z.object({
  score: z.number().min(0).max(100),
  pattern: z.string(),
  findings: z.array(FindingSchema),
  recommendations: z.array(RecommendationSchema),
});
```

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Module produces at least 3 findings for any non-trivial project
- [ ] All findings reference specific files from the input
- [ ] Output validates against Zod schema without errors
- [ ] Runs in under 30 seconds
- [ ] Handles empty/minimal repos gracefully

---

## TASK-013: Code Quality Analysis Module

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Implement the Code Quality analysis module.

### Requirements

- Analyzes code readability and maintainability
- Identifies DRY violations (code duplication)
- Spots code smells (god objects, long methods, deep nesting)
- Evaluates naming conventions and consistency
- Detects obvious bugs or logic errors
- Checks error handling patterns
- Produces scored findings

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- Same as TASK-012

---

## TASK-014: Security Analysis Module

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Implement the Security analysis module — the highest-impact module.

### Requirements

- Checks for SQL injection patterns
- Checks for hardcoded secrets/credentials in code
- Evaluates input validation practices
- Reviews authentication implementation
- Checks for authorization bypass risks
- Reviews environment variable security
- Identifies CSRF vulnerabilities
- Checks for insecure dependencies (conceptual)
- Critical findings must be specific with file paths

### Prompt Requirements

- Security findings must be specific and verifiable (not general warnings)
- Must distinguish between confirmed issues and potential risks
- Must provide specific remediation steps
- Must not generate false alarms for well-implemented patterns

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Correctly identifies hardcoded secrets in test fixtures
- [ ] Identifies SQL injection patterns
- [ ] Does not false-positive on parameterized queries (Prisma)
- [ ] Critical findings include specific file paths and line numbers
- [ ] Output validates against schema without errors

---

## TASK-015: Dependencies Analysis Module

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Evaluate the health and quality of project dependencies.

### Requirements

- Parse package.json / requirements.txt / Gemfile / go.mod / Cargo.toml
- Identify outdated major versions
- Flag dependencies with known CVE patterns (based on version + common vulnerability knowledge)
- Check for dev/prod dependency separation
- Identify unnecessary or bloated dependencies
- Check for lock file presence

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Correctly parses npm, Python, Ruby, Go dependency files
- [ ] Identifies at least one finding for projects with outdated deps
- [ ] Handles monorepos with multiple package.json files

---

## TASK-016: Product Readiness Analysis Module

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Evaluate whether the product is ready to ship and serve real users.

### Requirements

- Checks for onboarding flows
- Checks for error handling user-facing
- Checks for loading and empty states
- Checks for authentication flows
- Checks for privacy policy / terms pages
- Checks for contact/support mechanism
- Checks for analytics integration
- Checks for SEO basics (meta tags, OG tags)

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Produces relevant findings for typical SaaS project
- [ ] Identifies missing auth flows
- [ ] Identifies missing legal pages
- [ ] Does not produce generic "add error handling" type non-findings

---

## TASK-017: SaaS Score Calculation Algorithm

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Implement the weighted SaaS Score calculation from module scores.

### Requirements

- Implement weighted formula from `ai-system-design.md`
- Score clamped to 0–100
- Score label mapped to range
- Score breakdown stored per module in `analyses.scoreBreakdown`
- Handle missing modules (not all 12 run in MVP)

### Implementation Notes

```typescript
const weights = {
  architecture: 0.15,
  code_quality: 0.12,
  security: 0.18,
  // ...
};

function calculateScore(moduleScores: Record<string, number>): number {
  // Weighted average of available modules
}
```

### Dependencies

- TASK-012 through TASK-016

### Acceptance Criteria

- [ ] Score between 0–100 for all tested projects
- [ ] Score label matches range correctly
- [ ] Score reflects actual quality (manually verified on 5 test repos)
- [ ] Partial module set produces valid score

---

## TASK-018: Analysis Results Page

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Create the primary analysis output view.

### Requirements

- SaaS Score display (large, prominent, animated count-up)
- Score label and trend
- Executive summary section
- Module scores overview (12 module cards with scores)
- Full findings list with filtering and sorting
- Finding severity badges (color-coded)
- Module grouping of findings
- "Run New Analysis" button

### Design

- Score display: 64px font, circular progress indicator
- Module cards: small cards in a grid (3×4 or 4×3)
- Findings: list view with severity left-border accent

### Dependencies

- TASK-017, TASK-006

### Acceptance Criteria

- [ ] Score animates on first view
- [ ] Findings filter by severity
- [ ] Findings filter by module
- [ ] Page loads within 2 seconds (SSR)
- [ ] Mobile responsive

---

## TASK-019: Executive Summary Generation

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Generate a high-quality AI executive summary that synthesizes all module findings.

### Requirements

- Runs after all modules complete
- Reads all module outputs
- Produces a 3–5 paragraph strategic summary
- Highlights top 3 priorities
- References specific findings
- Written in first-person CTO voice ("Your project shows...")
- Stored in `analyses.summary`

### Implementation Notes

- Use claude-opus-4-8 for synthesis
- Prompt includes: all module scores, top findings, project metadata
- Output: plain text, formatted with paragraphs
- Maximum: 500 words

### Dependencies

- TASK-012 through TASK-016

### Acceptance Criteria

- [ ] Summary is specific to the analyzed project (not generic)
- [ ] Summary references actual findings
- [ ] Tone is direct and advisory (not hedging)
- [ ] Generated in under 30 seconds

---

## TASK-020: Finding Cards and Detail View

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create the UI for displaying individual findings with expand/detail functionality.

### Requirements

- Finding card: severity badge, module tag, title, brief description
- Expand to show: full description, file path/line, recommendation, effort estimate
- Severity color coding (Critical: red, High: orange, Medium: yellow, Low: blue)
- "Mark as Resolved" button
- Smooth expand/collapse animation
- Keyboard accessible (Enter to expand)

### Dependencies

- TASK-018

### Acceptance Criteria

- [ ] All severity colors correct
- [ ] Expand/collapse works smoothly
- [ ] File paths are monospaced and copyable
- [ ] Resolved findings show visual state change
- [ ] Keyboard accessible

---

## TASK-021: Analysis Progress Real-Time Updates

**Phase:** 1 — MVP
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Show real-time analysis progress to the user while analysis is running.

### Requirements

- Progress bar (0–100%)
- Current stage label ("Analyzing security...")
- Module completion checklist (shows as each module completes)
- Fallback polling if SSE fails (every 3 seconds)
- Redirect to results when complete
- Error state with retry

### Implementation Notes

- SSE endpoint: `/api/analyses/[id]/progress`
- Publishes events when `analyses.status` or `analyses.progress` changes
- Client uses `EventSource` API
- Fallback: `setInterval` polling if EventSource fails

### Dependencies

- TASK-011, TASK-018

### Acceptance Criteria

- [ ] Progress updates appear within 2 seconds of module completion
- [ ] Polling fallback works correctly
- [ ] Redirects to results automatically on completion
- [ ] Error state shown with retry button

---

## TASK-022: Stripe Integration and Pro Tier

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Integrate Stripe for Pro subscription payments.

### Requirements

- Stripe customer created on user sign-up
- Pro plan product and price configured in Stripe
- Checkout flow: pricing page → Stripe Checkout → success redirect
- Stripe webhook handler (`/api/webhooks/stripe`):
  - `checkout.session.completed` → activate Pro
  - `customer.subscription.deleted` → downgrade to Free
  - `invoice.payment_failed` → email user
- Stripe Customer Portal for self-serve management
- `subscriptions` table updated from webhooks
- Plan reflected in user session

### Implementation Notes

- Use Stripe Checkout (hosted) for simplicity in MVP
- Webhook verification with `stripe.webhooks.constructEvent()`
- Handle all Stripe event types robustly (idempotent handlers)
- Test with Stripe test mode and test cards

### Dependencies

- TASK-003, TASK-004

### Acceptance Criteria

- [ ] User can upgrade to Pro via Stripe Checkout
- [ ] Pro features unlocked immediately after payment
- [ ] Downgrade works correctly on cancellation
- [ ] Stripe Customer Portal accessible from settings
- [ ] Webhook handler is idempotent (duplicate events handled)

---

## TASK-023: Free Tier Limits Enforcement

**Phase:** 1 — MVP
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Enforce all free tier limits with clear upgrade prompts.

### Requirements

- Free limits:
  - 1 project maximum
  - 2 analyses per month
  - 5 analysis modules (not 12)
  - Public repos only
  - No PDF export
  - No AI Advisor
- Paywall trigger: clear modal with plan comparison
- Paywall CTA: "Upgrade to Pro — $29/month"
- Track monthly usage in `usage_events` table
- Monthly counter resets on billing date

### Implementation Notes

- `src/lib/billing/limits.ts` — functions to check limits
- Called in: project creation API, analysis trigger API, feature routes
- Paywall modal component reused across all limit triggers
- Monthly reset: background job or computed from `usage_events.createdAt`

### Dependencies

- TASK-022, TASK-003

### Acceptance Criteria

- [ ] Free user cannot create more than 1 project
- [ ] Free user sees clear paywall at 3rd analysis attempt
- [ ] Paywall modal links to pricing/checkout correctly
- [ ] Pro user has no false limits triggered
- [ ] Monthly counter resets correctly

---

## TASK-024: User Settings Page

**Phase:** 1 — MVP
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create user account settings and preferences page.

### Requirements

- Profile: name, avatar (from Clerk, not editable here)
- GitHub connection status + connect/disconnect
- Notification preferences (analysis complete email toggle)
- Plan and billing:
  - Current plan display
  - Upgrade button (if free)
  - "Manage Billing" → Stripe Customer Portal
- Danger zone:
  - Delete account (soft-delete, with confirmation)
  - Delete all data

### Dependencies

- TASK-004, TASK-007, TASK-022

### Acceptance Criteria

- [ ] GitHub connection status is accurate
- [ ] Disconnect GitHub deletes the stored token
- [ ] Delete account requires "type your email to confirm" pattern
- [ ] Stripe Customer Portal link works

---

## TASK-025: Transactional Email Setup

**Phase:** 1 — MVP
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Set up Resend and build the initial email templates.

### Requirements

- Resend configured with verified domain
- React Email for templating
- Email templates:
  - Welcome email (on sign-up)
  - Analysis complete notification
  - Analysis failed notification
- `src/lib/email/index.ts` — email sending utility
- Unsubscribe link in all non-transactional emails

### Implementation Notes

- Install `resend` and `@react-email/components`
- Create `src/emails/` directory for templates
- Preview emails locally with `react-email` dev server
- From address: `noreply@aicto.dev` (or configured domain)

### Dependencies

- TASK-004

### Acceptance Criteria

- [ ] Welcome email sends on sign-up (via Clerk webhook)
- [ ] Analysis complete email sends within 30 seconds of completion
- [ ] All emails render correctly in Gmail, Apple Mail, Outlook
- [ ] Unsubscribe link works
