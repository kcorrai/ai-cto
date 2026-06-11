# Phase 4 — Growth Systems Tasks

## TASK-071: Public SaaS Score Leaderboard

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Create a public leaderboard of SaaS Score rankings for popular public repositories.

### Requirements

- Curated list of popular open-source SaaS projects, analyzed with AI CTO
- Leaderboard: ranked by SaaS Score
- Filters: by language, framework, category
- Search by project name
- Each entry: project name, GitHub link, score, top finding summary
- "Submit a project" form for community contributions
- SEO-optimized page with meta tags

### Implementation Notes

- Pre-analyze ~50 well-known projects at launch
- Ongoing: community can submit public repos for analysis (with moderation)
- This is a major SEO and virality asset

### Dependencies

- TASK-018, TASK-041

### Acceptance Criteria

- [ ] Leaderboard renders with 50+ entries at launch
- [ ] Filters work correctly
- [ ] Page is SEO-optimized
- [ ] Updates as new public analyses are added

---

## TASK-072: README Badge (SVG, Live Score)

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create an embeddable SVG badge showing the live SaaS Score.

### Requirements

- SVG badge endpoint: `/api/badge/[projectId]`
- Shows: "AI CTO Score: 74" with color based on range
- Updates when score changes (no caching, or max 1-hour cache)
- Badge variants: flat, flat-square, for-the-badge (shields.io style)
- Setup instructions in project settings
- Copy-paste Markdown code provided

### Implementation Notes

- Generate SVG dynamically in route handler
- Cache with Vercel Cache Headers: `s-maxage=3600`
- Badge requires project to be public or user to have Pro+
- Route behind authentication check (still serves badge but tracks usage)

### Dependencies

- TASK-018

### Acceptance Criteria

- [ ] Badge renders correctly in GitHub README
- [ ] Badge color matches score range
- [ ] Updates within 1 hour of score change
- [ ] Copy-paste code works for both Markdown and HTML

---

## TASK-073: Programmatic SEO Analysis Pages

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Generate SEO-optimized pages for AI CTO analyses of popular repos.

### Requirements

- Page template: `/explore/[owner]/[repo]`
- Content: analysis results, score, top findings, "Analyze your repo" CTA
- SEO: unique title, description, OG image per repo
- Canonical URL for duplicate content prevention
- Sitemap generation including all public analysis pages
- robots.txt configured correctly

### Implementation Notes

- Generate pages for top 1000 most-starred public repos in key categories
- Use Next.js `generateStaticParams` for SSG
- Add ISR for frequent updates without full rebuild

### Dependencies

- TASK-041

### Acceptance Criteria

- [ ] Pages rank for "[repo name] analysis" queries
- [ ] All pages have unique SEO metadata
- [ ] Sitemap includes all public analysis pages
- [ ] CTA converts visitors to sign-ups

---

## TASK-074: GitHub App Migration (from OAuth App)

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Migrate from GitHub OAuth App to GitHub App for better rate limits and capabilities.

### Requirements

- Register AI CTO as a GitHub App
- Users install the app on their account/organization
- App permissions: read-only access to code
- Rate limits: 15,000 requests/hour vs. 5,000 for OAuth
- Webhook support: receive push events for auto-analysis
- Smoother installation flow
- Migrate existing OAuth tokens to App tokens where possible

### Implementation Notes

- GitHub App uses installation tokens (short-lived, per-installation)
- Tokens refreshed automatically (no long-lived storage needed)
- Better security model than OAuth tokens

### Dependencies

- TASK-007

### Acceptance Criteria

- [ ] Existing users can migrate to App installation
- [ ] New users use App installation by default
- [ ] Rate limit errors reduced significantly
- [ ] Webhook push events received correctly

---

## TASK-075: GitHub Webhook Push-Triggered Analysis

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Automatically re-analyze projects when new code is pushed to GitHub.

### Requirements

- Pro+ feature: "Auto-analyze on push" toggle in project settings
- GitHub webhook created when enabled
- Webhook verifies signature before processing
- Only re-analyze if: significant code changes (not just config/docs)
- Rate limit: max 1 auto-analysis per 24 hours per project
- Notification: "New analysis triggered by push to main"
- User can disable auto-analysis at any time

### Dependencies

- TASK-074, TASK-011

### Acceptance Criteria

- [ ] Analysis triggers within 2 minutes of a push
- [ ] Only triggers for code changes (filters out README-only pushes)
- [ ] Rate limit prevents spam
- [ ] Signature verification works

---

## TASK-076: Affiliate and Referral Program

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Build a referral program for organic growth.

### Requirements

- Every user gets a unique referral link
- Referred user gets: 30 days free Pro trial (vs. 14 days default)
- Referrer gets: $10 credit on first referred conversion
- Affiliate tier: approved affiliates get 30% recurring for 12 months
- Dashboard: referred users, conversions, earned credits, payouts
- Minimum payout: $50 via Stripe
- Attribution: cookie-based (60-day window)

### Implementation Notes

- Referral tracking: set cookie on click, associate with signup
- Use Stripe Connect for affiliate payouts
- Affiliate applications reviewed manually (first version)

### Dependencies

- TASK-022, TASK-004

### Acceptance Criteria

- [ ] Referral link generates and copies correctly
- [ ] Referred users get extended trial
- [ ] Conversion tracked and credited correctly
- [ ] Payout dashboard shows accurate numbers

---

## TASK-077: REST API v1 Implementation

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 2.5 days
**Status:** Backlog

### Objective

Build the public REST API for Pro+ users.

### Requirements

Endpoints:

- `GET /v1/projects` — list projects
- `POST /v1/projects` — create project
- `GET /v1/projects/:id` — get project
- `GET /v1/projects/:id/analyses` — list analyses
- `POST /v1/projects/:id/analyses` — trigger analysis
- `GET /v1/analyses/:id` — get analysis result
- `GET /v1/analyses/:id/findings` — get findings
- `GET /v1/projects/:id/score` — get current score

Authentication: `Authorization: Bearer {api_key}` header
Response format: `{ data, meta, error }` envelope
Pagination: cursor-based on list endpoints

### Dependencies

- TASK-078, TASK-003

### Acceptance Criteria

- [ ] All endpoints implemented and documented
- [ ] API key auth works correctly
- [ ] Rate limiting enforced per key
- [ ] Pagination works on list endpoints
- [ ] Error responses are consistent

---

## TASK-078: API Key Management UI

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow Pro+ users to create and manage API keys.

### Requirements

- Settings → API Keys section
- Create key: name, optional expiry, scope selection
- Key displayed once on creation (with copy button and warning)
- Key list: shows prefix (`aicto_live_abc...`), name, last used, created
- Revoke key (with confirmation)
- Maximum: 5 keys per user

### Dependencies

- TASK-003, TASK-024

### Acceptance Criteria

- [ ] Key shown only once, cannot be retrieved later
- [ ] Revoke works immediately
- [ ] Last used date updates correctly

---

## TASK-079: API Documentation (OpenAPI Spec)

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create comprehensive API documentation.

### Requirements

- OpenAPI 3.1 spec for all API endpoints
- Interactive documentation page (Swagger UI or Scalar)
- Code examples in: TypeScript, Python, curl
- Authentication guide
- Rate limit documentation
- Changelog section
- Public URL: `aicto.dev/docs/api`

### Dependencies

- TASK-077

### Acceptance Criteria

- [ ] All endpoints documented with request/response examples
- [ ] Authentication section is clear
- [ ] Interactive API playground works

---

## TASK-080: Linear Integration

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Allow Team+ users to push findings directly to Linear as issues.

### Requirements

- OAuth integration with Linear
- "Push to Linear" button on findings
- Select Linear team and project before pushing
- Maps severity to priority (Critical → Urgent, High → High, etc.)
- Creates Linear issue with: AI CTO label, finding title, description, recommendation, link back
- Tracks which findings have been pushed (shows "In Linear" badge)
- Bulk push: select multiple findings → push all

### Dependencies

- TASK-020

### Acceptance Criteria

- [ ] OAuth with Linear works
- [ ] Issue created in Linear with correct priority
- [ ] "In Linear" badge shown on pushed findings
- [ ] Bulk push works for multiple findings

---

## TASK-081: Rate Limiting Per API Key

**Phase:** 4 — Growth Systems
**Priority:** High
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Implement rate limiting for API key authentication.

### Requirements

- Sliding window rate limiting per API key
- Limits by plan: Pro: 100/hour, Team: 500/hour, Enterprise: custom
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- `429 Too Many Requests` with `Retry-After` header
- Rate limit data stored in Upstash Redis

### Dependencies

- TASK-077, TASK-078

### Acceptance Criteria

- [ ] Rate limit headers present on all API responses
- [ ] 429 returned correctly when limit exceeded
- [ ] `Retry-After` header is accurate
- [ ] Rate limit resets correctly

---

## TASK-082: Programmatic SEO: Framework Analysis Pages

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Generate SEO pages targeting framework-specific analysis queries.

### Requirements

- Pages: `/best-practices/[framework]` (e.g., `/best-practices/nextjs`)
- Content: common issues found in AI CTO analyses for that framework
- Data: aggregated findings from public analyses (anonymized)
- CTA: "Analyze your [framework] project"
- Target keywords: "Next.js project review", "Django security audit", etc.

### Dependencies

- TASK-073

### Acceptance Criteria

- [ ] Pages exist for top 10 frameworks
- [ ] Content is specific to each framework
- [ ] SEO-optimized with unique metadata

---

## TASK-083: Social Sharing Flow Improvements

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Make sharing analysis results frictionless and compelling.

### Requirements

- "Share your score" modal on analysis completion
- Pre-written tweet: "My [project] scored [X]/100 on @aictodev. AI CTO found [N] issues. [link]"
- Share to: Twitter/X, LinkedIn, Copy link
- Score card image preview before sharing
- Track share events in analytics
- "Share" button in results header

### Dependencies

- TASK-040, TASK-041

### Acceptance Criteria

- [ ] Share modal appears after first analysis completes
- [ ] Pre-written tweet is compelling and accurate
- [ ] OG image preview loads in modal
- [ ] Share events tracked in PostHog

---

## TASK-084: Developer Changelog / Product Updates Page

**Phase:** 4 — Growth Systems
**Priority:** Low
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Create a public changelog showing product updates.

### Requirements

- Public page: `aicto.dev/changelog`
- Each entry: date, title, description, category tag (feature/improvement/fix)
- Atom/RSS feed for changelog
- "What's New" notification in app header (unread indicator)
- Email digest option for major releases

### Dependencies

- TASK-006

### Acceptance Criteria

- [ ] Changelog page renders correctly
- [ ] RSS feed is valid
- [ ] In-app notification shows for new entries

---

## TASK-085: Testimonials and Social Proof System

**Phase:** 4 — Growth Systems
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Systematically capture and display user testimonials.

### Requirements

- Post-analysis prompt: "Was this analysis helpful?" → leads to testimonial form if positive
- Testimonials reviewed and approved before display
- Display: landing page wall of love, pricing page
- Include: quote, name, role, product name, avatar
- Import from Twitter/X mentions (manual)
- Testimonial widget: embeddable by users on their own sites

### Dependencies

- TASK-018, TASK-005

### Acceptance Criteria

- [ ] Testimonial request appears at appropriate moment
- [ ] Admin approval workflow works
- [ ] Landing page testimonials display correctly
