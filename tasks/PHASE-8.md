# Task Definitions — Phase 8: Quality & Growth

> Task-driven build reference. No implementation code here.
> For project state, read CLAUDE.md.
> Tasks ordered by score (impact × ease × urgency). Do highest score first.

---

## TASK-131 — Prisma CASCADE DELETE + Compound Indexes

**Phase:** 8
**Score:** 93/100
**Effort:** 0.5 day
**Depends:** none
**Reads:** `docs/database-schema.md`

**Objective:**
Fix data integrity gaps in the Prisma schema. When a User or Project is deleted, child records (Analysis, Finding, Report, etc.) must be cascade-deleted automatically. Add missing compound indexes for the queries that run on every page load.

**Scope:**

- Add `onDelete: Cascade` to all child relations of `Project`: Analysis, Finding, Report, ScheduledAnalysis, AdvisorConversation
- Add `onDelete: Cascade` to all child relations of `Analysis`: AnalysisModule, Finding (via analysis), Report
- Add `onDelete: Cascade` to all child relations of `User`: ApiKey, ActivityEvent, AuditLog, Referral, OrganizationMember
- Add compound indexes:
  - `Analysis`: `@@index([projectId, status, createdAt(sort: Desc)])`
  - `Finding`: `@@index([projectId, isResolved, severity])`
  - `User`: `@@index([referredById])`
  - `Subscription`: `@@index([stripeSubscriptionId])`
- Run `prisma migrate dev --name cascade_and_indexes`
- Verify migration applies cleanly

**Out of Scope:**

- No application code changes
- Do not touch Subscription → User cascade (Stripe FK constraint)
- Do not change soft-delete (`deletedAt`) fields

**Acceptance Criteria:**

- [ ] `pnpm prisma migrate dev` completes with zero errors
- [ ] `pnpm prisma validate` passes
- [ ] Deleting a Project in Prisma Studio cascades to all child records
- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] `pnpm test` still passes (82 tests)

---

## TASK-132 — Analysis Job Retry with Exponential Backoff

**Phase:** 8
**Score:** 89/100
**Effort:** 1 day
**Depends:** TASK-131
**Reads:** `docs/architecture.md`

**Objective:**
When an analysis job fails (network timeout, AI API error, GitHub error), it currently stays stuck in "analyzing" state forever. Implement retry logic with exponential backoff and a max-retry cap. After max retries, mark the analysis as "failed" and notify the user.

**Scope:**

- In `src/app/api/queues/analysis/route.ts`: wrap `processAnalysis()` in try/catch with retry loop
- Retry up to **3 times** with delays: 5s → 15s → 45s (exponential backoff)
- On final failure: set `analysis.status = "failed"`, set `analysis.error` message
- In `src/lib/analysis/processor.ts`: add per-module retry (1 retry, 10s delay) for AI API calls
- Add `retryCount` and `lastError` fields to `Analysis` model in Prisma schema (migration required)
- Send failure email if `retryCount >= 3` (reuse existing `analysis-failed` email template)
- Replace `console.error("Failed to queue analysis")` with structured log call

**Out of Scope:**

- No dead-letter queue infrastructure (keep it simple, DB-based)
- No UI changes for retry status
- Do not change the job queue provider

**Acceptance Criteria:**

- [ ] Simulating an AI API error causes the job to retry 3 times before marking failed
- [ ] Analysis stuck in "analyzing" for >10 minutes is detected and marked failed
- [ ] `analysis.retryCount` increments correctly in the DB
- [ ] Failure email is sent after max retries
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes

---

## TASK-133 — Finding Search + Filter UI

**Phase:** 8
**Score:** 87/100
**Effort:** 1 day
**Depends:** none
**Reads:** `docs/feature-specifications.md`, `docs/design-system.md`

**Objective:**
The analysis results page lists all findings but has no search or filter. Users with 50+ findings must scroll through everything. Add a search bar and filter controls so users can quickly find what matters.

**Scope:**

- Add to `src/app/(app)/projects/[id]/analysis/page.tsx`:
  - Free-text search input (filters by finding title + description, client-side)
  - Severity filter: multi-select chips (critical / high / medium / low / info)
  - Module filter: dropdown with all modules present in the analysis
  - Status filter: all / unresolved / resolved toggle
  - Result count: "Showing X of Y findings"
- Filter state in URL query params (`?severity=critical,high&module=security&q=auth`) for shareability
- All filtering is client-side (no new API calls) — data already loaded on page
- Match existing dark design system (use existing `Input`, `Badge`, `Button` components from shadcn)
- Mobile responsive

**Out of Scope:**

- No server-side filtering
- No saved filter presets
- No sorting beyond existing order

**Acceptance Criteria:**

- [ ] Typing in search filters findings in real-time (no debounce lag >150ms)
- [ ] Selecting severity chips shows only matching findings
- [ ] Module dropdown filters to that module's findings only
- [ ] URL updates with filter params; sharing the URL restores the same filter state
- [ ] "Showing X of Y findings" updates correctly
- [ ] Clearing all filters shows all findings again
- [ ] Mobile layout: filters collapse into an expandable panel
- [ ] `pnpm build` passes

---

## TASK-134 — Structured Logging (Replace console.error)

**Phase:** 8
**Score:** 85/100
**Effort:** 0.5 day
**Depends:** none

**Objective:**
Replace all 7 `console.error` / `console.log` instances in production code with a lightweight structured logger. Sensitive data must not appear in raw logs. Vercel's log drain reads stdout as JSON, so structured output is immediately useful.

**Scope:**

- Create `src/lib/logger.ts` — thin wrapper around `console` that outputs JSON with `{ level, message, timestamp, ...context }` in production, pretty-prints in dev
- No new npm package (use native `console` under the hood, structured output only)
- Replace all occurrences:
  - `src/lib/analysis/processor.ts` — module failure log
  - `src/lib/queue/analysis.ts` — queue failure log
  - `src/app/api/queues/analysis/route.ts` — `.catch(console.error)`
  - `src/app/api/webhooks/github/route.ts`
  - `src/app/api/webhooks/stripe/route.ts`
  - `src/app/(app)/error.tsx`
  - `src/lib/email/index.ts`
- Redact fields: never log full error objects that may contain tokens or user data; log `error.message` only
- Add `logger` export from `src/lib/logger.ts`

**Out of Scope:**

- No external log aggregation service (DataDog, Sentry) — just structured stdout
- No log rotation or file output
- Do not add logger to test files

**Acceptance Criteria:**

- [ ] `grep -r "console\." src/lib src/app/api` returns zero results (except logger.ts itself)
- [ ] In dev mode: logs are human-readable
- [ ] In production build: each log line is valid JSON
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes

---

## TASK-135 — GitHub Actions CI/CD Integration

**Phase:** 8
**Score:** 84/100
**Effort:** 0.5 day
**Depends:** none
**Reads:** `docs/feature-specifications.md`

**Objective:**
Let users trigger AI CTO analyses from their own GitHub Actions CI pipelines. Provide a ready-to-use workflow YAML and document the setup. This is a viral growth driver: every adopting repo gets the AI CTO badge + workflow visible to contributors.

**Scope:**

- Create example workflow file: `docs/github-actions-workflow.yml` (not in `.github/` — it's a template for users to copy)
- Workflow uses `curl` to call the existing REST API: `POST /api/v1/projects/{id}/analyses`
- Inputs: `AICTO_API_KEY` (secret), `AICTO_PROJECT_ID` (var)
- Workflow triggers on: `push` to `main`, `pull_request` (optional, commented out by default)
- Add a new marketing/docs page: `src/app/(marketing)/docs/github-actions/page.tsx`
  - Shows the workflow YAML in a copy-paste code block
  - Step-by-step setup guide (create API key → set secrets → add workflow)
  - Link to this page from `/docs/api` page
- Add "GitHub Actions" badge/link to the settings API keys section

**Out of Scope:**

- No GitHub Actions Marketplace publishing
- No official GitHub App for Actions (too complex)
- No auto-setup wizard

**Acceptance Criteria:**

- [ ] Docs page renders at `/docs/github-actions`
- [ ] Workflow YAML is syntactically valid (can be validated with `act` or GitHub's YAML linter)
- [ ] The curl command in the workflow matches the actual API endpoint and auth format
- [ ] Link from API settings page to the docs page works
- [ ] `pnpm build` passes

---

## TASK-136 — /api/health Endpoint

**Phase:** 8
**Score:** 83/100
**Effort:** 0.25 day
**Depends:** none

**Objective:**
Add a public health check endpoint that load balancers, uptime monitors (UptimeRobot, Better Uptime), and Vercel's infrastructure can poll to verify the service is alive.

**Scope:**

- Create `src/app/api/health/route.ts`
- `GET /api/health` — no authentication required
- Response: `{ status: "ok", timestamp: "<ISO string>", version: "<git SHA or package version>" }`
- HTTP 200 when healthy
- Add a lightweight DB ping: `await db.$queryRaw\`SELECT 1\``— if it fails, return 503 with`{ status: "degraded", error: "db_unavailable" }`
- Do NOT expose sensitive info (no env vars, no internal paths)

**Out of Scope:**

- No Redis health check (not worth the latency)
- No detailed service dependency map
- No authenticated health endpoint

**Acceptance Criteria:**

- [ ] `GET /api/health` returns 200 + JSON without authentication
- [ ] Response includes `status: "ok"` and `timestamp`
- [ ] When DB is unavailable, returns 503 + `status: "degraded"`
- [ ] `pnpm build` passes

---

## TASK-137 — Analysis Comparison View

**Phase:** 8
**Score:** 82/100
**Effort:** 1.5 days
**Depends:** TASK-133

**Objective:**
After re-running an analysis, users want to see what changed. Build a side-by-side comparison view that shows score deltas, new/resolved findings, and module score changes between any two analyses of the same project.

**Scope:**

- New route: `src/app/(app)/projects/[id]/compare/page.tsx`
  - Query params: `?a=<analysisId>&b=<analysisId>` (a = older, b = newer)
  - If params missing: show a picker UI with the project's analysis history
- Comparison sections:
  1. **Score delta**: overall score A vs B with +/- badge
  2. **Module scores table**: each module, score A, score B, delta (colored green/red)
  3. **New findings**: findings in B not present in A (matched by title + module)
  4. **Resolved findings**: findings in A marked resolved in B
  5. **Persisting findings**: still unresolved in both
- Add "Compare with previous" button on analysis results page (links to compare?a=prev&b=current)
- Add "Compare" link in analysis history page
- Data fetched server-side (two parallel DB queries)
- Reuse existing `FindingCard` component

**Out of Scope:**

- No cross-project comparison
- No 3-way comparison
- No diff of source code

**Acceptance Criteria:**

- [ ] `/projects/[id]/compare?a=X&b=Y` renders without errors for two valid analysis IDs
- [ ] Score delta shows correctly (positive = improvement, negative = regression)
- [ ] Module table lists all modules that appear in either analysis
- [ ] New/resolved/persisting finding counts are accurate
- [ ] "Compare with previous" button appears on the analysis page when ≥2 analyses exist
- [ ] Invalid analysis IDs show a user-friendly error
- [ ] `pnpm build` passes

---

## TASK-138 — GitHub OAuth Token Auto-Refresh

**Phase:** 8
**Score:** 80/100
**Effort:** 1 day
**Depends:** TASK-131

**Objective:**
GitHub OAuth tokens expire after ~1 year. When this happens, analyses silently fail with a GitHub API error and users don't understand why. Detect expired/revoked tokens and notify users to reconnect.

**Scope:**

- In `src/lib/github/client.ts`: wrap all GitHub API calls in a try/catch that detects `401 Unauthorized` responses
- On 401: set `User.githubAccessToken = null` in DB, set a new `User.githubTokenExpiredAt = new Date()` field (migration required)
- In `src/lib/analysis/processor.ts`: if `githubAccessToken` is null, throw a user-friendly error: "GitHub account disconnected — please reconnect in Settings"
- Add a banner component: `src/components/shared/github-reconnect-banner.tsx` — shows on dashboard and project pages when `githubTokenExpiredAt` is set
- Send a one-time email notification when token is detected as expired (reuse Resend, new template: `github-token-expired`)
- On successful GitHub reconnect (existing OAuth flow): clear `githubTokenExpiredAt`

**Out of Scope:**

- No automatic token refresh (GitHub OAuth apps don't support refresh tokens)
- No proactive expiry warning before the token expires
- No GitHub App token handling (already separate)

**Acceptance Criteria:**

- [ ] When a 401 is received from GitHub API, `githubTokenExpiredAt` is set in DB
- [ ] Reconnect banner shows on dashboard when token is expired
- [ ] Analysis triggered with expired token shows a clear error message (not a generic failure)
- [ ] After reconnecting GitHub OAuth, banner disappears
- [ ] Expiry email is sent (verify with Resend dashboard or test mode)
- [ ] `pnpm build` passes

---

## TASK-139 — Personal Analytics Dashboard

**Phase:** 8
**Score:** 79/100
**Effort:** 1.5 days
**Depends:** TASK-131

**Objective:**
Users have no visibility into their own usage. Build a personal analytics page showing analysis history, score trends, most common finding types, and plan usage at a glance.

**Scope:**

- New route: `src/app/(app)/dashboard/analytics/page.tsx`
- Sections:
  1. **Plan usage**: analyses used this month / limit, projects used / limit (progress bars)
  2. **Score trend**: line chart of average SaaS score across all projects over time (last 90 days)
  3. **Analysis activity**: bar chart — analyses per week over last 12 weeks
  4. **Top finding categories**: horizontal bar chart — which modules generate the most findings
  5. **Recent activity**: last 10 analyses across all projects (table with project name, date, score, status)
- All data fetched server-side, aggregated with Prisma queries
- Add "Analytics" link to the main sidebar nav (below Dashboard)
- Use existing chart components if available; if not, use a simple SVG-based chart (no new charting library)

**Out of Scope:**

- No token/cost breakdown (no cost data stored)
- No team-level analytics (that's `/team/usage`)
- No date range picker (fixed 90-day window)

**Acceptance Criteria:**

- [ ] `/dashboard/analytics` renders for a user with ≥1 project and ≥1 analysis
- [ ] Plan usage bars show correct numbers matching DB
- [ ] Score trend chart shows data points for each week that had an analysis
- [ ] Top finding categories chart is accurate (verified against DB query)
- [ ] Empty state renders gracefully when user has no analyses
- [ ] Analytics link appears in sidebar nav
- [ ] `pnpm build` passes

---

## TASK-140 — Jira Integration

**Phase:** 8
**Score:** 76/100
**Effort:** 2 days
**Depends:** TASK-131
**Reads:** `docs/feature-specifications.md`

**Objective:**
Linear integration exists for pushing findings to issues. Enterprise users predominantly use Jira. Add Jira Cloud OAuth2 integration that lets users push AI CTO findings directly to a Jira project as issues.

**Scope:**

- OAuth2 flow: `src/app/api/integrations/jira/connect/route.ts` + `src/app/api/integrations/jira/callback/route.ts`
- Store encrypted Jira access token + refresh token + cloud ID in `User` model (new fields, migration)
- Jira token auto-refresh (Jira uses refresh tokens unlike GitHub)
- Push endpoint: `src/app/api/integrations/jira/push/route.ts`
  - Input: `{ findingId, jiraProjectKey, issueType }`
  - Creates a Jira issue with: title = finding title, description = finding description + recommendation, labels = [`ai-cto`, severity], priority mapped from severity (critical→Highest, high→High, medium→Medium, low→Low)
  - Stores `jiraIssueKey` on the Finding record (new field)
- UI: add "Push to Jira" button on `FindingCard` component (alongside existing "Push to Linear")
- Settings page: `src/app/(app)/settings/page.tsx` — add Jira connect/disconnect section
- List user's Jira projects for picker: `GET /api/integrations/jira/projects`

**Out of Scope:**

- No Jira Server/Data Center (Cloud only)
- No bidirectional sync (push only)
- No webhook from Jira back to AI CTO

**Acceptance Criteria:**

- [ ] User can connect Jira OAuth from settings page
- [ ] "Push to Jira" button appears on finding cards when Jira is connected
- [ ] Pushing a finding creates a Jira issue with correct title, description, priority, and labels
- [ ] `jiraIssueKey` stored on the finding; button shows "View in Jira" link after push
- [ ] Jira access token refreshes automatically when expired
- [ ] Disconnecting Jira clears the token from DB
- [ ] `pnpm build` passes

---

## TASK-141 — @vitest/coverage-v8 + Pre-commit Test Hook

**Phase:** 8
**Score:** 73/100
**Effort:** 0.5 day
**Depends:** none

**Objective:**
`pnpm test:coverage` currently fails because `@vitest/coverage-v8` is not installed. Fix coverage reporting. Add a pre-commit hook so broken tests can't be committed.

**Scope:**

- Install `@vitest/coverage-v8` as devDependency
- Update `vitest.config.ts` coverage section: add `provider: "v8"`, set `thresholds: { lines: 70, functions: 70 }` for `src/lib/billing`, `src/lib/auth`, `src/lib/scoring` only
- Update `package.json`:
  - `"test:coverage": "vitest run --coverage"` (already exists, now works)
  - Add `"test:ci": "vitest run --reporter=verbose"` for CI environments
- Create `.husky/pre-commit` hook: runs `pnpm test --run` before each commit; blocks commit on failure
- Update `vitest.config.ts` to exclude test files from coverage (`exclude: ['**/*.test.ts']`)

**Out of Scope:**

- No coverage reporting to external service (Codecov, Coveralls)
- No coverage gate on CI (only pre-commit)
- Do not raise coverage thresholds beyond the 3 targeted modules

**Acceptance Criteria:**

- [ ] `pnpm test:coverage` runs successfully and shows a coverage table
- [ ] Coverage for `src/lib/billing`, `src/lib/auth`, `src/lib/scoring` shows ≥70%
- [ ] Pre-commit hook blocks a commit when a test is failing (verified manually)
- [ ] Pre-commit hook allows commit when all tests pass
- [ ] `pnpm build` passes

---

## TASK-142 — Webhook Retry with Exponential Backoff

**Phase:** 8
**Score:** 71/100
**Effort:** 1 day
**Depends:** TASK-131

**Objective:**
Outbound webhooks to customer endpoints currently fail permanently on first error. Add retry logic with exponential backoff so transient failures (endpoint temporarily down, timeout) don't result in lost notifications.

**Scope:**

- In `src/lib/webhooks.ts`: after a failed delivery, schedule a retry
- Retry schedule: attempt 2 after 1min, attempt 3 after 5min, attempt 4 after 30min, attempt 5 after 2hr
- Store retry state on `WebhookDelivery`: add `nextRetryAt: DateTime?` and `attemptCount: Int @default(1)` fields (migration)
- Add a cron job: `src/app/api/crons/webhook-retry/route.ts` — runs every minute, picks up `WebhookDelivery` records where `status = "failed"` and `nextRetryAt <= now` and `attemptCount < 5`
- Register cron in `vercel.json` or `vitest.config.ts`: `{ "path": "/api/crons/webhook-retry", "schedule": "* * * * *" }`
- After 5 failed attempts: set `status = "dead"`, stop retrying
- No UI changes — existing webhook delivery log already shows status

**Out of Scope:**

- No user notification on webhook death (out of scope for this task)
- No manual retry button in UI
- No dead-letter queue drain

**Acceptance Criteria:**

- [ ] Failed webhook delivery creates a retry record with correct `nextRetryAt`
- [ ] Cron endpoint picks up due retries and re-attempts delivery
- [ ] Successful retry sets `status = "success"`, `attemptCount` reflects total attempts
- [ ] After 5 failures, `status = "dead"` and no further retries
- [ ] `pnpm build` passes

---

## TASK-143 — Redis Caching for Analysis Results

**Phase:** 8
**Score:** 69/100
**Effort:** 1 day
**Depends:** TASK-131

**Objective:**
Analysis result pages hit the DB on every load. Redis is already configured but only used for rate limiting. Cache frequently-read analysis data to reduce DB queries and improve page load times.

**Scope:**

- Create `src/lib/cache.ts` — typed wrapper around the existing Upstash Redis client with `get<T>`, `set`, `invalidate`, `invalidatePattern` helpers
- Cache the following with TTLs:
  - Full analysis result (score, modules, findings): key `analysis:{id}`, TTL 24h
  - Project analysis list (history): key `project:{id}:analyses`, TTL 5min
  - User's project list: key `user:{userId}:projects`, TTL 5min
- Invalidate on write:
  - When analysis completes → invalidate `analysis:{id}` + `project:{id}:analyses`
  - When finding is resolved → invalidate `analysis:{id}`
  - When project is created/deleted → invalidate `user:{userId}:projects`
- Apply cache in:
  - `src/app/api/v1/projects/[id]/analyses/[analysisId]/route.ts`
  - `src/app/(app)/projects/[id]/analysis/page.tsx` (server component data fetch)
  - `src/app/(app)/projects/page.tsx` (project list)

**Out of Scope:**

- No cache warming (lazy cache only)
- No cache metrics/hit rate tracking
- Do not cache AI advisor chat responses

**Acceptance Criteria:**

- [ ] Second load of an analysis page is served from cache (verifiable via Redis CLI or Upstash dashboard)
- [ ] Resolving a finding invalidates the analysis cache (next load hits DB)
- [ ] Cache TTLs are correct (verify with Redis TTL command)
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes

---

## TASK-144 — Project Tags / Labels

**Phase:** 8
**Score:** 68/100
**Effort:** 1 day
**Depends:** TASK-131

**Objective:**
Users with multiple projects (Pro/Team plan) can't organize them. Add tags so users can label projects (e.g., "frontend", "client-A", "archived") and filter the project list by tag.

**Scope:**

- Add `tags: String[]` field to `Project` model in Prisma schema (migration)
- Tag management UI on project settings or overview page:
  - Inline tag editor: click to add, × to remove, auto-suggest from user's existing tags
  - Max 5 tags per project, max 20 characters per tag
- Project list page `src/app/(app)/projects/page.tsx`:
  - Tag filter: clickable tag chips above project grid, single-select, filters project cards
  - Filter state in URL: `?tag=frontend`
- Store and retrieve tags via existing project API routes (extend response schema)
- No new API route needed — extend PATCH `/api/projects/[id]` to accept `tags`

**Out of Scope:**

- No team-wide tag taxonomy (per-user tags only)
- No tag colors
- No tag-based bulk actions

**Acceptance Criteria:**

- [ ] User can add and remove tags on a project
- [ ] Tags appear on project cards in the project list
- [ ] Clicking a tag in the filter chips shows only projects with that tag
- [ ] URL updates to `?tag=<tagname>` when filtering
- [ ] Max 5 tags enforced (6th tag input is disabled)
- [ ] Tags persist after page reload
- [ ] `pnpm build` passes

---

## TASK-145 — Finding CSV Export

**Phase:** 8
**Score:** 63/100
**Effort:** 0.5 day
**Depends:** TASK-133

**Objective:**
Users want to share findings with stakeholders who don't use AI CTO. Add a CSV export button on the analysis page that respects active filters (severity, module, status, search query).

**Scope:**

- New API route: `GET /api/analyses/[id]/export/csv`
  - Query params: `severity`, `module`, `status`, `q` (mirrors the filter UI from TASK-133)
  - Returns CSV with columns: `severity, module, title, description, recommendation, filePath, isResolved, createdAt`
  - Content-Type: `text/csv`, Content-Disposition: `attachment; filename="ai-cto-findings-{date}.csv"`
  - No auth beyond existing session/API key check
- Add "Export CSV" button to the analysis page findings section (next to the filter controls from TASK-133)
  - Button reads current filter state from URL params and appends them to the export URL
  - Button disabled when there are 0 findings matching current filter

**Out of Scope:**

- No Excel (.xlsx) export
- No scheduled/automated export
- No CSV import

**Acceptance Criteria:**

- [ ] "Export CSV" button appears on the analysis page
- [ ] Clicking it downloads a CSV file with correct columns
- [ ] Active filters (severity, module, status) are reflected in the exported data
- [ ] Empty filter state exports all findings
- [ ] CSV is valid and opens correctly in Excel/Google Sheets
- [ ] `pnpm build` passes
