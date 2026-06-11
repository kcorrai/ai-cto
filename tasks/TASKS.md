# Task Definitions — Phase 1: MVP

> Task-driven build reference. No implementation code here.
> For system design context, read the docs listed under each task's "Reads".
> For project state, read CLAUDE.md.

---

## TASK-001 — Project Scaffolding

**Phase:** 1
**Effort:** 1 day
**Depends:** none
**Reads:** `docs/tech-stack.md`, `docs/architecture.md`

**Objective:**
Bootstrap the Next.js application with the full toolchain and folder structure defined in architecture.md. Nothing should be running yet, but the project must be buildable with zero errors.

**Scope:**

- Next.js 15 App Router, TypeScript strict mode
- Tailwind CSS v4 configured
- shadcn/ui initialized with dark theme as default
- Geist and Geist Mono fonts wired in
- ESLint + Prettier configured and passing
- Husky + lint-staged on pre-commit
- pnpm as package manager
- Folder structure created per `docs/architecture.md` (App Router section)
- `.env.example` with all variable name placeholders
- `README.md` with local setup instructions

**Out of Scope:**

- No pages yet (except the default Next.js index)
- No database connection
- No authentication

**Acceptance Criteria:**

- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Folder structure matches `docs/architecture.md` exactly
- [ ] Dark mode is the default (`class="dark"` on `<html>`)
- [ ] `.env.example` exists with all required key names

---

## TASK-002 — Environment Validation

**Phase:** 1
**Effort:** 0.5 day
**Depends:** TASK-001
**Reads:** `docs/tech-stack.md` (Environment Variables section)

**Objective:**
Create a validated, type-safe environment variable system that fails at startup — not at runtime — if required variables are missing.

**Scope:**

- `src/env.ts` using `@t3-oss/env-nextjs` + Zod
- All required variables listed, typed, and validated
- Server vars and client (NEXT*PUBLIC*) vars separated
- App crashes with a clear error message on missing vars
- `.env.example` updated to match the schema exactly
- No `process.env` access anywhere in the codebase except `env.ts`

**Variables to cover:**

- DATABASE_URL, DIRECT_URL
- CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- BLOB_READ_WRITE_TOKEN
- RESEND_API_KEY
- ENCRYPTION_KEY (32-byte hex, 64 chars)
- NEXT_PUBLIC_APP_URL

**Acceptance Criteria:**

- [ ] Removing any required var from `.env.local` causes build to fail with a named error
- [ ] Zod validates value format (not just presence) — e.g., STRIPE key starts with `sk_`
- [ ] No raw `process.env` usage outside `env.ts`
- [ ] `.env.example` mirrors the schema exactly, with comments on each var

---

## TASK-003 — Database + Prisma Setup

**Phase:** 1
**Effort:** 1.5 days
**Depends:** TASK-001, TASK-002
**Reads:** `docs/database-schema.md` (MVP Tables section)

**Objective:**
Provision Neon PostgreSQL via Vercel Marketplace, write the Prisma schema for MVP tables only, run the initial migration, and create a working seed for development.

**Scope:**

- Neon database provisioned and connected
- `prisma/schema.prisma` with these tables only:
  - `users`
  - `subscriptions`
  - `projects`
  - `analyses`
  - `analysis_modules`
  - `findings`
- All columns per `docs/database-schema.md` for the above tables
- UUID primary keys via `gen_random_uuid()`
- `@@index` on every foreign key column
- `directUrl` configured for migrations (Neon pooler for runtime)
- `src/lib/db/index.ts` — singleton Prisma client with dev hot-reload guard
- `prisma/seed.ts` — 1 test user, 1 test project

**Out of Scope:**

- Organization tables (Phase 5)
- advisor_conversations, api_keys, webhooks, audit_logs (later phases)

**Acceptance Criteria:**

- [ ] `pnpm prisma migrate dev --name init` runs without error
- [ ] `pnpm prisma studio` shows all 6 tables with correct columns
- [ ] `pnpm prisma db seed` creates the test records
- [ ] Prisma-generated types are importable in `src/`
- [ ] The singleton client pattern prevents connection pool exhaustion in dev

---

## TASK-004 — Clerk Authentication

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-001, TASK-002, TASK-003
**Reads:** `docs/security.md` (Authentication section)

**Objective:**
Wire Clerk as the authentication provider. All routes under `(app)/` must be protected. User records must sync to the database via webhook on sign-up.

**Scope:**

- `@clerk/nextjs` installed and configured
- `src/middleware.ts` — protects all `/app/*` routes, allows all `/api/webhooks/*`
- `app/layout.tsx` wrapped with `<ClerkProvider>`
- Sign-in page: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Sign-up page: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Webhook handler: `app/api/webhooks/clerk/route.ts`
  - `user.created` → `db.user.create()`
  - `user.updated` → `db.user.update()`
  - `user.deleted` → `db.user.update({ deletedAt: now })`
- Webhook signature verified via `svix` before any processing
- `<UserButton />` placed in top nav (stub — full nav in TASK-006)

**Out of Scope:**

- GitHub token storage (TASK-007)
- Organization support (Phase 5)

**Acceptance Criteria:**

- [ ] Navigating to `/dashboard` unauthenticated → redirected to `/sign-in`
- [ ] GitHub OAuth sign-in completes and lands on `/dashboard`
- [ ] User row created in `users` table after first sign-in (verify in Prisma Studio)
- [ ] Webhook endpoint returns 200 for valid Svix signatures, 403 for invalid
- [ ] No session data in any API response beyond what Clerk provides

---

## TASK-005 — Marketing Landing Page

**Phase:** 1
**Effort:** 2 days
**Depends:** TASK-001, TASK-004
**Reads:** `docs/design-system.md`, `docs/feature-specifications.md`

**Objective:**
Create the public-facing marketing site. One job: convert a visitor into a sign-up. Every design decision must serve that goal.

**Scope:**

- `app/(marketing)/page.tsx` — landing page
- `app/(marketing)/pricing/page.tsx` — pricing comparison
- `app/(marketing)/layout.tsx` — shared marketing layout with nav + footer

**Landing page sections (in order):**

1. **Hero** — headline, subheadline, primary CTA (→ sign-up), secondary CTA (→ demo/pricing)
2. **How it works** — 3 steps: Connect GitHub → Analyze → Get your AI CTO report
3. **Feature grid** — 6 cards, one per core module (Architecture, Security, AI Advisor, SaaS Score, Reports, Growth)
4. **Score mockup** — static visual of a SaaS Score card (not functional)
5. **Pricing teaser** — 3 columns (Free / Pro / Team), link to `/pricing` for full comparison
6. **Footer** — product links, legal links

**Design constraints from `docs/design-system.md`:**

- Background: `#0a0a0a` (not Tailwind's `bg-black`)
- No images — Lucide icons only
- Font: Geist for all text
- Primary accent: `#3b82f6`

**OG / SEO:**

- `<title>`, `<meta description>`, `og:title`, `og:description`, `og:image` set in layout metadata

**Acceptance Criteria:**

- [ ] All 6 sections render correctly
- [ ] No broken links
- [ ] Mobile layout correct at 375px — no horizontal overflow
- [ ] Lighthouse performance ≥ 90
- [ ] Sign-up CTA routes to Clerk sign-up
- [ ] OG image tag is set (can be placeholder URL)

---

## TASK-006 — App Shell + Navigation

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-001, TASK-004
**Reads:** `docs/design-system.md` (Layout System section)

**Objective:**
Build the persistent application layout — sidebar, top bar, and main content area — that wraps every authenticated page.

**Scope:**

- `app/(app)/layout.tsx` — CSS Grid: `240px sidebar | main content`, `48px topbar | page content`
- `src/components/shared/Sidebar.tsx`
  - Primary nav: Dashboard, Projects, Settings
  - Project sub-nav (conditionally rendered when on a `/projects/[id]/*` route): Overview, Analysis, Advisor, Reports
  - Active item style: accent background + accent text
  - Collapses to icon-only on mobile
- `src/components/shared/TopBar.tsx`
  - Page title (from route)
  - `<UserButton />` from Clerk
- `app/(app)/dashboard/page.tsx` — empty shell, just "Dashboard" heading (content in TASK-009)

**Design values from `docs/design-system.md`:**

- Sidebar bg: `#111111`
- Sidebar border-right: `#1f1f1f`
- Topbar height: `48px`, border-bottom: `#1f1f1f`
- Nav item height: `36px`

**Out of Scope:**

- Actual dashboard content (TASK-009 and TASK-018)

**Acceptance Criteria:**

- [ ] Sidebar visible on all `(app)` pages
- [ ] Active route highlighted in sidebar
- [ ] Project sub-nav appears only on `/projects/[id]/*` routes
- [ ] Mobile: sidebar hidden by default, opens via hamburger
- [ ] Keyboard navigation through sidebar works (Tab, Enter, Escape)
- [ ] Top bar renders with `<UserButton>` on the right

---

## TASK-007 — GitHub OAuth + Token Storage

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-003, TASK-004
**Reads:** `docs/security.md` (GitHub Token Security section)

**Objective:**
Allow users to connect a GitHub account separate from their Clerk sign-in. Store the OAuth token encrypted. Never expose the raw token outside the server.

**Scope:**

- GitHub OAuth App registered in GitHub → client ID + secret in `.env.local`
- `src/lib/crypto.ts` — `encrypt(text)` and `decrypt(text)` using AES-256-GCM with the `ENCRYPTION_KEY` env var
- `app/api/auth/github/connect/route.ts` — initiates OAuth, generates + stores CSRF state in Redis
- `app/api/auth/github/callback/route.ts` — verifies state, exchanges code for token, encrypts, stores in `users.githubAccessToken`
- `app/api/auth/github/disconnect/route.ts` — deletes the stored token, nulls the field
- `src/lib/github/client.ts` — `getGitHubClient(userId)` — decrypts token, returns Octokit instance
- "Connect GitHub" button in settings page (stub — full settings page in TASK-024)

**Constraints from `docs/security.md`:**

- Token encrypted before hitting the database, always
- Decryption only inside server-side functions — never returned to client
- CSRF state verified before token exchange — rejected if missing or mismatched
- Scope requested: `repo` (Pro users), `public_repo` (Free users)

**Out of Scope:**

- GitHub App migration (Phase 4, TASK-074)

**Acceptance Criteria:**

- [ ] OAuth flow completes end-to-end — `users.githubAccessToken` is set
- [ ] Stored value is ciphertext — not the raw token
- [ ] `getGitHubClient(userId)` returns a working Octokit instance
- [ ] Disconnect route nulls the token and returns 204
- [ ] State parameter mismatch returns 403 — no token stored
- [ ] No token value appears in any log, response body, or error message

---

## TASK-008 — GitHub Repository Browser

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-007
**Reads:** (none — pure UI + API)

**Objective:**
Give users a fast, searchable interface to browse and select their GitHub repositories when creating a project.

**Scope:**

- `app/api/github/repos/route.ts` — fetches user's repos via `getGitHubClient()`, cached in Redis for 5 minutes
  - Returns: `{ id, name, fullName, isPrivate, language, updatedAt, defaultBranch }`[]
  - Includes personal repos and repos from orgs the user belongs to
- `src/features/projects/components/RepoBrowser.tsx` — Client Component
  - Fetches from `/api/github/repos` on mount
  - Real-time search filtering by name (client-side)
  - Sort: Recently updated (default), Name A–Z
  - Each item: name, Private/Public badge, language, "Updated X days ago"
  - Click → `onSelect(repo)` callback
  - Loading state: skeleton rows
  - Empty state: "No repositories found. Make sure GitHub is connected."
  - Error state: "Could not load repositories." + reconnect link

**Out of Scope:**

- Branch browser (happens in project creation step 2, TASK-009)

**Acceptance Criteria:**

- [ ] Repos load in < 3 seconds
- [ ] Search filters in real time with no debounce delay visible to user
- [ ] Private repos visible (when token has `repo` scope)
- [ ] Org repos listed separately from personal repos
- [ ] `onSelect` fires with correct repo data on click
- [ ] Skeleton shows during load, not a spinner

---

## TASK-009 — Project Creation Flow

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-007, TASK-008, TASK-003
**Reads:** `docs/database-schema.md` (projects table), `docs/monetization.md` (Free tier limits)

**Objective:**
Let users connect a GitHub repo as a project and immediately trigger the first analysis. The flow must enforce plan limits before anything is created.

**Scope:**

- `app/(app)/projects/new/page.tsx` — 3-step flow:
  - Step 1: Repository selection via `<RepoBrowser />`
  - Step 2: Name (pre-filled from repo name) + branch selection (fetched from GitHub API)
  - Step 3: Creating → redirect to project overview
- `src/features/projects/actions.ts` — `createProject` Server Action:
  1. Check project count against plan limit — throw `PlanLimitError` if exceeded
  2. Check repo not already connected — throw `DuplicateError` if so
  3. Create `projects` record
  4. Enqueue first analysis (calls `triggerAnalysis` from TASK-011)
  5. Redirect to `/projects/[id]/overview`
- `src/components/shared/PlanLimitModal.tsx` — shown when plan limit hit
  - Message: "You've reached your project limit on the Free plan"
  - CTA: "Upgrade to Pro" → `/api/stripe/checkout`
  - Dismiss link

**Acceptance Criteria:**

- [ ] Full 3-step flow completes in < 5 user actions
- [ ] Duplicate repo connection returns a clear error, no duplicate created
- [ ] Free user creating a 2nd project sees `PlanLimitModal` — not an error page
- [ ] Branch selection shows real branches from GitHub
- [ ] On success, user lands at `/projects/[id]/overview` with analysis queued

---

## TASK-010 — Repository Fetcher

**Phase:** 1
**Effort:** 2 days
**Depends:** TASK-007, TASK-003
**Reads:** `docs/ai-system-design.md` (Repository Fetch section, File Selection Priority)

**Objective:**
Fetch a repository's content from GitHub and produce a structured bundle that the analysis modules can consume. Intelligent file sampling is the core engineering challenge here.

**Scope:**

- `src/lib/github/fetcher.ts` — `fetchRepository(projectId, userId): Promise<RepoBundle>`
  1. Fetch repo metadata via GitHub API (`/repos/{owner}/{repo}`)
  2. Fetch full recursive file tree (`/git/trees/{sha}?recursive=1`)
  3. Score and select up to 100 files using priority rules below
  4. Fetch selected file contents in parallel batches of 10
  5. Store the bundle as JSON in Vercel Blob at `analyses/{analysisId}/repo-bundle.json`
  6. Return the bundle

**File priority scoring (from `docs/ai-system-design.md`):**

- Entry points (`index.ts`, `app.ts`, `main.py`, `server.ts`): highest priority
- Config files (`package.json`, `next.config.ts`, `.env.example`, `prisma/schema.prisma`): very high
- Core business logic files (`/api/`, `/services/`, `/lib/`): high
- Domain models and schemas: high
- README and docs: medium
- Test files: sample only (low)
- Binary files: skip entirely
- Files > 50KB: skip

**Constraints:**

- Max 100 files selected total
- Max 50KB per file
- Blob stored as private, deleted after analysis completes

**Acceptance Criteria:**

- [ ] Bundle produced for a 50-file Next.js project in < 15 seconds
- [ ] Repos with > 10,000 files are handled via sampling — no timeout, no crash
- [ ] Blob stored at the correct path and readable by analysis workers
- [ ] Empty repos (0 files) return an empty bundle, no error
- [ ] Binary files never appear in the bundle

---

## TASK-011 — Analysis Job Queue

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-003, TASK-010
**Reads:** `docs/architecture.md` (Analysis Pipeline section)

**Objective:**
Set up the async job system that runs analyses outside the request/response cycle. A triggered analysis must be idempotent — triggering it twice must not create two concurrent runs.

**Scope:**

- `src/lib/queue/analysis.ts` — `triggerAnalysis(projectId, userId, trigger)`:
  1. Acquire Redis lock `analysis:lock:{projectId}` (NX, TTL 10 min) — reject if already locked
  2. Create `analyses` record with `status: "queued"`
  3. Publish job to Vercel Queue `analysis-jobs` with `{ analysisId, projectId, userId }`
  4. Return `analysisId`
- `app/api/queues/analysis/route.ts` — queue consumer:
  1. Update analysis `status: "fetching"`, `progress: 5`
  2. Call `fetchRepository()` → get bundle
  3. Update `status: "analyzing"`, `progress: 20`
  4. Run analysis modules (Phase 1: 5 modules in parallel)
  5. Update `status: "synthesizing"`, `progress: 85`
  6. Compute SaaS Score, generate summary
  7. Update `status: "complete"`, `progress: 100`, write score + findings
  8. Release Redis lock
  9. On any error: set `status: "failed"`, `errorMessage`, release lock, re-throw (triggers Vercel Queues retry)

**Idempotency requirement:**

- If the queue consumer receives a duplicate job, the analysis record already exists — check status and skip if `complete` or `running`.

**Acceptance Criteria:**

- [ ] `triggerAnalysis()` creates an `analyses` record and returns the ID
- [ ] Calling it twice while one is running returns an error on the second call
- [ ] Status transitions are written to DB at each pipeline stage
- [ ] Redis lock is released on both success and failure paths
- [ ] Re-throw on failure causes Vercel Queues to retry (infrastructure failures only)

---

## TASK-012 — Architecture Analysis Module

**Phase:** 1
**Effort:** 1.5 days
**Depends:** TASK-010, TASK-011
**Reads:** `docs/ai-system-design.md` (Module 1: Architecture Analysis)

**Objective:**
Build the architecture analysis module — one of 5 MVP modules. Each module follows the same pattern: receive the repo bundle, call an AI model with a focused prompt, parse structured output, persist results.

**Scope:**

- `src/lib/ai/modules/architecture.ts` — module implementation
- `src/lib/ai/prompts/architecture.ts` — prompt template (version-tagged comment at top)
- `src/lib/ai/gateway.ts` — Vercel AI Gateway wrapper (created once, shared by all modules)
- Uses Vercel AI SDK `generateObject()` with a Zod output schema
- Persists result to `analysis_modules` table with: score, findings, token count, duration

**Output schema (Zod):**

```
score: number (0–100)
pattern: string (detected architectural pattern name)
findings: array of:
  - severity: critical | high | medium | low | info
  - title: string (max 200 chars)
  - description: string
  - recommendation: string
  - filePath: string (optional — actual path from bundle)
  - effort: low | medium | high
  - impact: low | medium | high
strengths: string[] (positive aspects, 2–5 items)
```

**Prompt requirements (from `docs/ai-system-design.md`):**

- All findings must reference actual file paths from the input bundle
- No generic advice ("add error handling") without a specific location
- The model is instructed to say "not applicable" rather than fabricate findings
- Prompt is versioned with a date comment (`// v1 — YYYY-MM-DD`)

**Model:** `claude-sonnet-4-6` via Vercel AI Gateway

**Acceptance Criteria:**

- [ ] Module returns a valid object that passes the Zod schema
- [ ] At least 3 findings for any non-trivial repo
- [ ] All findings include a `filePath` that exists in the bundle
- [ ] `analysis_modules` record updated with score, duration, token count
- [ ] Runs in < 30 seconds on a 50-file project
- [ ] Empty bundle handled gracefully — module returns score 0, no crash

---

## TASK-013 — Code Quality Module

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-010, TASK-011
**Reads:** `docs/ai-system-design.md` (Module 2: Code Quality Analysis)

**Objective:**
Second of 5 MVP analysis modules. Same implementation pattern as TASK-012.

**Analysis focus (for the prompt):**

- DRY violations and code duplication
- Function size and single responsibility
- Naming quality (variables, functions, files)
- Error handling presence and consistency
- Code smells: deep nesting, god objects, long parameter lists
- TypeScript: `any` usage, implicit types
- Obvious logic errors or unreachable code

**Files:** `src/lib/ai/modules/code-quality.ts`, `src/lib/ai/prompts/code-quality.ts`

**Acceptance Criteria:** Same as TASK-012.

---

## TASK-014 — Security Analysis Module

**Phase:** 1
**Effort:** 1.5 days
**Depends:** TASK-010, TASK-011
**Reads:** `docs/ai-system-design.md` (Module 3: Security Analysis), `docs/security.md`

**Objective:**
Third MVP module. Security carries the highest weight in the SaaS Score (18%). The prompt must distinguish confirmed vulnerabilities from conceptual risks.

**Analysis focus (for the prompt):**

- SQL injection: raw string interpolation in queries
- Hardcoded secrets: API keys, passwords, tokens in source code
- Missing input validation on API routes
- Missing authentication checks on sensitive routes
- Missing authorization / ownership checks
- CSRF: state-changing GET routes
- Environment variable exposure (secrets in code)
- Insecure direct object reference patterns

**Severity mapping:**

- `critical`: confirmed vulnerability in code that exists now
- `high`: pattern that is likely vulnerable under normal usage
- `medium`: risk that requires specific conditions to exploit
- `low` / `info`: hygiene issues

**Files:** `src/lib/ai/modules/security.ts`, `src/lib/ai/prompts/security.ts`

**Acceptance Criteria:**

- [ ] Same as TASK-012
- [ ] Correctly flags hardcoded secrets in test fixture files
- [ ] Does NOT false-positive on Prisma parameterized queries as "SQL injection"

---

## TASK-015 — Dependencies Module

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-010, TASK-011
**Reads:** `docs/ai-system-design.md` (Module 7: Dependencies Analysis)

**Objective:**
Fourth MVP module. Evaluates dependency health from the manifest files in the bundle.

**Analysis focus:**

- Parse: `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`
- Outdated major versions (based on AI knowledge of version history)
- Known vulnerability patterns for common packages by version range
- Dev dependencies incorrectly in production list
- Lock file presence (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)
- Monorepo: handle multiple manifests

**Files:** `src/lib/ai/modules/dependencies.ts`, `src/lib/ai/prompts/dependencies.ts`

**Acceptance Criteria:** Same as TASK-012. Handles at least: npm, Python pip, Ruby Bundler.

---

## TASK-016 — Product Readiness Module

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-010, TASK-011
**Reads:** `docs/ai-system-design.md` (Module 11: Product Readiness Analysis)

**Objective:**
Fifth and final MVP module. Evaluates whether the product is ready to put in front of real users.

**Analysis focus:**

- Onboarding flow presence (new user path exists)
- Error states: does the UI handle and communicate errors?
- Loading states: are async operations communicated?
- Authentication UI: sign-in, sign-up flows exist
- Privacy policy and terms pages
- Contact or support mechanism
- Analytics or telemetry integration
- SEO basics: `<title>`, meta description, OG tags

**Files:** `src/lib/ai/modules/product-readiness.ts`, `src/lib/ai/prompts/product-readiness.ts`

**Acceptance Criteria:** Same as TASK-012.

---

## TASK-017 — SaaS Score Algorithm

**Phase:** 1
**Effort:** 0.5 day
**Depends:** TASK-012, TASK-013, TASK-014, TASK-015, TASK-016
**Reads:** `docs/ai-system-design.md` (SaaS Score Algorithm section)

**Objective:**
Compute the single composite SaaS Score from module scores using the weighted formula. Store it and a human-readable label in the analysis record.

**Scope:**

- `src/lib/scoring/saas-score.ts` — `calculateSaaSScore(moduleScores)`:
  - Takes a partial map of module → score (handles fewer than 12 modules)
  - Applies weights from `docs/ai-system-design.md`
  - Normalizes for partial module sets (don't penalize for locked modules)
  - Returns: `{ score: number, label: string, breakdown: Record<string, number> }`
- Labels per range (from ai-system-design.md): Pre-Alpha | Early Stage | Needs Work | Nearly There | Launch-Ready
- Called from the queue consumer (TASK-011) after all modules complete
- Writes `analyses.score` and `analyses.scoreBreakdown` (JSONB)
- Unit tests covering: 0 modules, 1 module, partial set, full set, boundary values

**Acceptance Criteria:**

- [ ] Output is always an integer 0–100
- [ ] Label matches range correctly for all 5 ranges
- [ ] Partial module set produces a valid score (not 0 by default)
- [ ] Unit tests pass for boundary values (0, 34, 35, 49, 50, 64, 65, 79, 80, 100)
- [ ] Score written to `analyses` record after queue consumer completes

---

## TASK-018 — Analysis Results Page

**Phase:** 1
**Effort:** 2 days
**Depends:** TASK-017, TASK-006
**Reads:** `docs/design-system.md` (SaaS Score Display, Module Cards, Finding Cards, Layout)

**Objective:**
The primary product surface. Users come here to read their AI CTO report. It must communicate the score, module breakdown, and findings in a way that is scannable in 30 seconds and detailed on demand.

**Scope:**

- `app/(app)/projects/[id]/analysis/page.tsx` — Server Component, fetches latest complete analysis
- `src/features/analyses/components/ScoreDisplay.tsx` — large score with animation
- `src/features/analyses/components/ModuleGrid.tsx` — score cards per module
- `src/features/analyses/components/FindingsList.tsx` — filterable, grouped findings list
- `src/features/analyses/components/ExecutiveSummary.tsx` — summary section

**ScoreDisplay design:**

- Score number: 64px, semibold, color-coded to range
- Arc or circular progress indicator around the score
- Label below: one of the 5 SaaS Score labels
- Count-up animation on first mount (0 → final score)
- No animation on subsequent views

**ModuleGrid design:**

- Cards in a grid (3×2 for 5 MVP modules)
- Each card: module name, score/100, small fill bar
- Color matches score range

**FindingsList design:**

- Filter row: All | Critical | High | Medium | Low tabs
- Findings grouped by module (collapsible sections)
- Each row: left severity border, title, module tag
- Click to expand (TASK-020)

**Data:**

- SSR: fetch from DB in Server Component
- If no complete analysis exists: show "Run your first analysis" CTA
- If analysis is running: redirect to overview (TASK-021 handles the progress view)

**Acceptance Criteria:**

- [ ] Score animates on first view of each analysis
- [ ] Severity filter tabs filter correctly
- [ ] Module sections collapse/expand
- [ ] Page renders via SSR — no loading flash
- [ ] Mobile layout correct at 375px
- [ ] Empty analysis state shown with CTA

---

## TASK-019 — Executive Summary (AI)

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-012, TASK-013, TASK-014, TASK-015, TASK-016
**Reads:** `docs/ai-system-design.md` (Synthesis Phase section)

**Objective:**
After all modules complete, run one final AI call to synthesize the results into a strategic 300–400 word executive summary written in first-person CTO voice.

**Scope:**

- `src/lib/ai/synthesis.ts` — `generateExecutiveSummary(modules, metadata)`:
  - Model: `claude-opus-4-8` (synthesis uses the strongest model)
  - Input: all module scores, top critical findings (max 5), project metadata
  - Output: plain text, 3–4 paragraphs
  - Prompt instructs: use "Your project..." framing, reference specific findings, end with one clear priority action
  - Max tokens: 800
- Called from queue consumer after `calculateSaaSScore` completes
- Stored in `analyses.summary`
- Rendered in `ExecutiveSummary` component (TASK-018)

**Prompt constraints:**

- Must not be generic ("Your project has some areas for improvement")
- Must reference at least 2 specific findings by name
- Must mention the score and the most impactful module
- Versioned with date comment

**Acceptance Criteria:**

- [ ] Summary references the project name
- [ ] Summary references at least 2 specific finding titles
- [ ] Summary is under 400 words
- [ ] Tone is direct, not hedging
- [ ] Summary written to `analyses.summary` and visible on results page

---

## TASK-020 — Finding Cards + Detail View

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-018
**Reads:** `docs/design-system.md` (Finding Cards section)

**Objective:**
Make findings actionable. Each finding card expands to show the full context, recommendation, and a resolve control.

**Scope:**

- `src/features/analyses/components/FindingCard.tsx`
  - Collapsed state: severity left-border, severity badge, module tag, title
  - Expanded state (animate height): description, file path (monospace), recommendation block, effort + impact tags
  - Expand/collapse on click or Enter key
  - Framer Motion `AnimatePresence` + height animation
- `src/features/analyses/components/SeverityBadge.tsx` — reusable badge (Critical / High / Medium / Low / Info)
- `app/api/findings/[id]/resolve/route.ts` — PATCH endpoint, sets `isResolved: true`, `resolvedAt: now`
- Resolve button in expanded finding card — optimistic UI update

**Severity colors (from `docs/design-system.md`):**

- Critical: `#ef4444` (left border + badge)
- High: `#f97316`
- Medium: `#f59e0b`
- Low: `#3b82f6`
- Info: `#71717a`

**Acceptance Criteria:**

- [ ] Expand/collapse animation runs at 60fps — no layout shift
- [ ] File path shown in monospace font, copyable
- [ ] Recommendation displayed in a visually distinct block
- [ ] Resolving a finding updates UI immediately (optimistic) and persists
- [ ] Resolved finding shows a "Resolved" state, not disappearing immediately
- [ ] Keyboard accessible: Tab to focus, Enter to expand, Tab to resolve button

---

## TASK-021 — Analysis Progress Stream

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-011, TASK-018
**Reads:** (none — implementation pattern only)

**Objective:**
Show real-time analysis progress while the job is running. Users should see the pipeline move through stages without refreshing.

**Scope:**

- `app/api/analyses/[id]/progress/route.ts` — Server-Sent Events endpoint
  - Polls `analyses` table every 2 seconds
  - Sends: `{ status, progress, currentModule }` as SSE events
  - Closes stream when `status` is `complete` or `failed`
  - Requires auth — verifies user owns the analysis
- `src/features/analyses/components/AnalysisProgress.tsx` — Client Component
  - Connects to SSE endpoint via `EventSource`
  - Shows: progress bar (0–100%), stage label, module checklist (marks complete as each finishes)
  - On `complete`: `router.push('/projects/[id]/analysis')`
  - On `failed`: shows error message + "Retry" button
  - Fallback: if `EventSource` not supported or connection drops → poll `/api/analyses/[id]` every 3 seconds
- `app/(app)/projects/[id]/overview/page.tsx`
  - If analysis running → renders `<AnalysisProgress />`
  - If analysis complete → renders score summary + "View full report" link
  - If no analysis → renders "Run your first analysis" CTA

**Acceptance Criteria:**

- [ ] Progress updates appear within 3 seconds of a stage change
- [ ] Auto-redirects to `/analysis` page when complete
- [ ] Polling fallback activates if SSE drops — verified by disabling SSE in browser
- [ ] Error state shows with retry — retry calls `triggerAnalysis()` again
- [ ] Auth check — another user's analysis ID returns 403

---

## TASK-022 — Stripe + Pro Plan

**Phase:** 1
**Effort:** 2 days
**Depends:** TASK-003, TASK-004
**Reads:** `docs/monetization.md` (Pro tier, Billing Implementation section)

**Objective:**
Enable paid subscriptions. A user on the Free plan must be able to upgrade to Pro, and the system must correctly activate and deactivate plan features based on subscription state.

**Scope:**

- Stripe products created: Pro monthly ($29), Pro annual ($290)
- `src/lib/stripe/client.ts` — Stripe singleton
- `src/lib/stripe/plans.ts` — plan limits map (Free / Pro / Team)
- `app/api/stripe/checkout/route.ts` — creates Stripe Checkout Session, attaches `userId` and `plan` in metadata
- `app/api/stripe/portal/route.ts` — creates Stripe Customer Portal session for self-serve management
- `app/api/webhooks/stripe/route.ts` — processes Stripe events:
  - `checkout.session.completed` → create `subscriptions` record, set `users.plan = "pro"`
  - `customer.subscription.updated` → update subscription status
  - `customer.subscription.deleted` → set `users.plan = "free"`
  - `invoice.payment_failed` → send payment failed email (uses TASK-025)
- Stripe customer created on user sign-up (in Clerk webhook handler from TASK-004)
- All webhook events verified via `stripe.webhooks.constructEvent()`

**Idempotency:** Webhook handlers must handle duplicate deliveries without side effects.

**Acceptance Criteria:**

- [ ] Checkout with Stripe test card 4242 4242 4242 4242 completes
- [ ] `users.plan` set to `"pro"` in DB after checkout
- [ ] Stripe Customer Portal accessible and functional from settings page
- [ ] `subscription.deleted` event sets `users.plan` back to `"free"`
- [ ] Duplicate webhook events produce no duplicate DB records
- [ ] Invalid webhook signatures return 400 immediately

---

## TASK-023 — Plan Limits Enforcement

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-022, TASK-003
**Reads:** `docs/monetization.md` (Free tier limits table)

**Objective:**
Enforce plan limits at the API layer — not the UI layer. The UI shows helpful paywalls, but the enforcement happens server-side so it cannot be bypassed.

**Scope:**

- `src/lib/billing/limits.ts`:
  - `checkProjectLimit(userId)` — throws `PlanLimitError` if at limit
  - `checkAnalysisLimit(userId)` — counts analyses this calendar month, throws if at limit
  - `getModulesForPlan(plan)` — returns the list of module names the plan permits
  - `getPlanLimits(plan)` — returns the limits object for a given plan
- Free plan limits (from `docs/monetization.md`):
  - 1 project
  - 2 analyses/month
  - 5 modules (architecture, code quality, security, dependencies, product readiness)
  - Public repos only
- Enforcement points:
  - `createProject` action (TASK-009): calls `checkProjectLimit`
  - `triggerAnalysis` (TASK-011): calls `checkAnalysisLimit`, passes filtered module list
- `src/components/shared/PlanLimitModal.tsx` — shown by UI when a limit error is caught
  - Reason displayed: "project limit" or "analysis limit"
  - CTA: Upgrade to Pro

**Acceptance Criteria:**

- [ ] Free user creating a 2nd project → `PlanLimitError` thrown, `PlanLimitModal` shown
- [ ] Free user's 3rd analysis in the same month → blocked at API, modal shown
- [ ] Free analysis runs only 5 modules — verified in `analysis_modules` table (5 rows, not 12)
- [ ] Pro user has no false limits triggered
- [ ] Limit check is server-side — cannot be bypassed by removing modal from DOM

---

## TASK-024 — User Settings Page

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-004, TASK-007, TASK-022
**Reads:** `docs/feature-specifications.md` (Feature 13: Subscription and Billing)

**Objective:**
Give users a single place to manage their account, GitHub connection, notification preferences, and billing.

**Scope:**

- `app/(app)/settings/page.tsx` — four sections:

  **Profile:**
  - Avatar (read-only, from Clerk)
  - Name and email (read-only, with "Edit in account settings" link → Clerk UserProfile modal)

  **GitHub:**
  - Connected: shows username + "Disconnect" button → `DELETE /api/auth/github/disconnect`
  - Not connected: "Connect GitHub" button → `/api/auth/github/connect`

  **Notifications (stored in `users.settings` JSONB):**
  - Toggle: "Email me when analysis completes"
  - Toggle: "Weekly digest" (visible but locked/grayed for Free plan)

  **Plan & Billing:**
  - Current plan badge (Free / Pro / Team)
  - Usage: "X of Y analyses this month"
  - If Free: "Upgrade to Pro" → checkout
  - If paid: "Manage Billing" → Stripe Customer Portal

  **Danger Zone:**
  - "Delete my account" → confirmation dialog requiring user to type their email → soft-delete (sets `users.deletedAt`)

**Acceptance Criteria:**

- [ ] GitHub connection status is accurate (reflects actual DB state)
- [ ] Disconnect removes token and updates UI immediately
- [ ] Plan badge shows correct plan
- [ ] Usage counter shows correct count for current month
- [ ] Delete requires email confirmation — no deletion without it
- [ ] All sections visible on mobile without horizontal scroll

---

## TASK-025 — Transactional Email

**Phase:** 1
**Effort:** 1 day
**Depends:** TASK-004
**Reads:** (none — self-contained)

**Objective:**
Set up Resend as the email provider and build the three emails needed before launch. Emails are the main async communication channel to users — they must be reliable and look professional.

**Scope:**

- Resend configured with a verified sending domain
- `src/lib/email/index.ts` — `sendEmail({ to, subject, react })` wrapper around Resend SDK
- Three email templates using `@react-email/components`:
  - `src/emails/WelcomeEmail.tsx` — triggered by `user.created` Clerk webhook
    - Subject: "Welcome to AI CTO — Run your first analysis"
    - Content: 3-step quick start, CTA button
  - `src/emails/AnalysisCompleteEmail.tsx` — triggered by queue consumer on completion
    - Subject: "Your [project] analysis is ready — Score: [X]/100"
    - Content: score display, top 3 findings (title only), CTA to view report
  - `src/emails/AnalysisFailedEmail.tsx` — triggered by queue consumer on failure
    - Subject: "Analysis failed for [project]"
    - Content: what went wrong (generic), retry CTA
- All templates previewed locally via React Email dev server before shipping
- Unsubscribe link in all non-transactional emails (required for deliverability)

**Acceptance Criteria:**

- [ ] Welcome email arrives within 60 seconds of sign-up
- [ ] Analysis complete email arrives within 60 seconds of completion
- [ ] All 3 templates render correctly in Gmail (check via React Email preview export)
- [ ] Resend dashboard shows delivered status (not bounced or spam)
- [ ] Unsubscribe link present in WelcomeEmail and AnalysisCompleteEmail
