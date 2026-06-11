# Feature Specifications

## Feature Index

1. GitHub Repository Connection
2. Project Dashboard
3. Analysis Engine
4. Analysis Results View
5. SaaS Score
6. AI CTO Advisor (Chat)
7. Report Generation and Export
8. Finding Management
9. Notifications
10. Team Collaboration
11. API Access
12. Webhooks and Integrations
13. Subscription and Billing

---

## Feature 1: GitHub Repository Connection

### Overview

Users connect their GitHub account via OAuth and select repositories to analyze.

### User Story

As an indie hacker, I want to connect my GitHub account so AI CTO can analyze my private repositories.

### Flows

**Connect GitHub:**

1. User clicks "Connect GitHub" in settings or project creation
2. Redirected to GitHub OAuth consent screen
3. User grants requested scopes (`repo` or `public_repo`)
4. Redirected back, OAuth code exchanged for access token
5. Token encrypted and stored
6. GitHub username shown as connected

**Create Project from GitHub:**

1. User clicks "New Project"
2. User selects "GitHub Repository" as source
3. GitHub repos fetched and displayed (searchable, sorted by updated_at)
4. User selects repository
5. User selects branch (default: main/master)
6. Project created, initial analysis queued

### Edge Cases

- Token expired: user prompted to reconnect
- Repository deleted on GitHub: graceful error in analysis
- Large repository (>50k files): warning shown, user can proceed
- Repository has no code (empty): "Nothing to analyze" state
- Rate limit from GitHub API: analysis queued with delay, user notified

### Implementation Notes

- Use GitHub App instead of OAuth App for better rate limits (post-MVP)
- Store minimal repository metadata to avoid excessive GitHub API calls
- Refresh token list on demand, not automatically (avoid rate limit issues)

---

## Feature 2: Project Dashboard

### Overview

The main view when a user enters the app. Shows all their projects with quick-access metrics.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Projects                            + New Project   │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  my-saas     │  │  api-server  │  │  mobile... │ │
│  │              │  │              │  │            │ │
│  │    Score 74  │  │    Score 51  │  │  Analyzing │ │
│  │  ──────────  │  │  ──────────  │  │  ░░░░░░░░  │ │
│  │  3 critical  │  │  7 critical  │  │  ████████  │ │
│  │              │  │              │  │    62%     │ │
│  │  2 days ago  │  │  5 days ago  │  │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Project Card States

- **Active**: Score, critical finding count, last analyzed date, score trend
- **Analyzing**: Progress bar with percentage, current module name
- **Error**: Error message, retry button
- **Never analyzed**: "Run Analysis" CTA

### Interactions

- Click card → navigate to project overview
- Hover → show quick action buttons (Analyze, View Report)
- Keyboard: full keyboard navigation

---

## Feature 3: Analysis Engine

### Overview

The core technical pipeline that analyzes a repository.

### Trigger Types

- **Manual**: User clicks "Run Analysis"
- **Auto**: Repository push via GitHub webhook (Pro+)
- **Scheduled**: Weekly/monthly re-analysis (Team+)
- **API**: Via REST API (Pro+)

### Progress Communication

Analysis progress is communicated via:

1. Database polling (fallback, every 2 seconds)
2. Server-Sent Events (preferred, real-time)

Progress states shown to user:

```
Connecting to GitHub...
Fetching repository structure...
Analyzing architecture... (1/12)
Analyzing security... (2/12)
...
Synthesizing findings...
Generating report...
Complete!
```

### Time Limits

- Target completion: 90 seconds (small repo), 3 minutes (large repo)
- Hard timeout: 5 minutes — analysis marked failed after this
- Free tier: limited to first 5 modules (faster, cheaper)

### Retry Logic

- Failed analyses can be retried (up to 3 times for infra failures)
- User always sees retry button on failure
- Partial results shown if at least 3 modules completed

---

## Feature 4: Analysis Results View

### Overview

The primary output page. Shows all findings organized by module and severity.

### Layout Structure

```
Project Name                                    [Run Analysis]

Score: 74  /  Nearly There
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executive Summary
─────────────────
Your project shows strong fundamentals with clear areas for improvement.
The most critical issues are in security (3 critical findings) and
missing SaaS features (billing, onboarding). Addressing these before
launch would significantly reduce risk.

Module Scores
─────────────
Architecture   ████████░░  78/100
Code Quality   ███████░░░  68/100
Security       ████░░░░░░  41/100   ← 3 critical
Performance    ████████░░  75/100
Testing        ████░░░░░░  40/100
...

All Findings (23)
─────────────────
[Filter: All | Critical | High | Medium | Low]

● CRITICAL: SQL injection in /api/users
● CRITICAL: API keys committed to git history
● HIGH: No rate limiting on authentication endpoints
...
```

### Finding Details

Clicking a finding expands or opens a detail panel:

- Full description
- Context (file path, line numbers)
- Specific recommended fix (with code example if applicable)
- Effort estimate (hours / days)
- Impact description
- Links to relevant documentation
- "Mark as Resolved" button

### Filters and Sorting

Users can filter findings by:

- Severity (Critical, High, Medium, Low, Info)
- Module (Architecture, Security, etc.)
- Status (Open, Resolved)
- Effort (Quick wins, Medium, Large)
- Impact (High, Medium, Low)

Sort by: Priority (default), Severity, Module, Effort/Impact ratio

---

## Feature 5: SaaS Score

### Overview

A single 0–100 score summarizing the project's overall health and maturity.

### Score Visualization

Large circular score display with:

- Animated count-up on first view
- Color coded: red (0–34), orange (35–49), yellow (50–64), blue (65–79), green (80–100)
- Label: "Pre-Alpha", "Early Stage", "Needs Work", "Nearly There", "Launch-Ready"
- Trend indicator vs. previous analysis (↑12 | ↓3)

### Score Breakdown

Radar/spider chart showing all 12 module scores (optional — may be Post-MVP).

### Shareable Score Card

Users can generate a shareable image card (og:image style):

```
┌─────────────────────────────────┐
│  AI CTO Analysis                │
│                                 │
│  my-saas.com / GitHub           │
│                                 │
│          74                     │
│       ────────                  │
│    Nearly There                 │
│                                 │
│  Analyzed by AI CTO             │
└─────────────────────────────────┘
```

Shareable link: `aicto.dev/score/[publicToken]`

---

## Feature 6: AI CTO Advisor (Chat)

### Overview

A conversational AI interface that allows users to ask follow-up questions about their analysis.

### Interface

Persistent chat panel accessible from the project view:

```
┌─────────────────────────────────────────────┐
│  AI CTO Advisor                      [Clear] │
├─────────────────────────────────────────────┤
│                                             │
│  I've reviewed your project and I'm         │
│  ready to help. What would you like to      │
│  know?                                      │
│                                             │
│  Suggested questions:                       │
│  • What should I fix first before launch?  │
│  • Explain the security vulnerabilities     │
│  • How do I add billing to my app?          │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Ask anything about your project...   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Suggested Prompts

Dynamically generated based on the analysis:

- Based on critical findings: "How do I fix [top critical issue]?"
- Based on score: "What are the top 3 things to do before launch?"
- Based on missing features: "How should I add [missing feature]?"

### Conversation History

- Conversations saved per project
- Users can start new conversations
- History available for Pro+ users

### Model Context

Advisor always has access to:

- Latest analysis results (structured)
- Project metadata (language, framework, stage)
- Previous messages in the conversation

---

## Feature 7: Report Generation and Export

### Overview

Generate professional, shareable analysis reports.

### Report Types

**Summary Report (Free)**

- Score overview
- Top 5 findings
- Shareable link (no PDF)

**Full Report (Pro+)**

- Complete findings list
- Module-by-module breakdown
- Executive summary
- Recommended action plan
- Export: PDF, Markdown, JSON

**Investor Due Diligence Report (Pro+)**

- Technical overview for non-technical readers
- Architecture summary
- Security posture
- Scalability assessment
- Risk summary
- Available as branded PDF

### Report Page Layout

Reports are standalone pages (shareable link):

```
URL: app.aicto.dev/reports/[publicToken]
```

- No authentication required if public
- Branded with AI CTO and optionally user's company name
- Print-optimized CSS
- Dark/light mode toggle

---

## Feature 8: Finding Management

### Overview

Tools for users to track and manage their findings.

### Finding Actions

- **Mark as Resolved**: Marks finding as fixed, adds timestamp and user
- **Dismiss**: Marks as "accepted risk" with optional note
- **Create Task**: Pushes finding to Linear/GitHub Issues (Pro+)
- **Share**: Generates shareable link to this specific finding
- **Copy Fix**: Copies the recommended fix to clipboard

### Resolved Findings

Resolved findings are:

- Hidden from default view (can be shown via filter)
- Tracked in history
- Used to calculate "fixes since last analysis" delta
- Included in progress notifications ("You've resolved 8 findings this week!")

---

## Feature 9: Notifications

### In-App Notifications

Bell icon in top nav. Notification types:

- Analysis complete
- Analysis failed
- Weekly digest (Pro+)
- Team member actions (Team+)
- New critical finding (auto-analysis)

### Email Notifications

Managed via user settings (all opt-in):

- Analysis complete (default: on)
- Weekly digest (default: on for Pro+)
- Critical finding detected (default: on)
- Trial ending / subscription events (system, cannot disable)

**Weekly Digest Email:**

- Score trend for each project
- New findings since last digest
- Suggested quick wins
- Progress on resolved findings

---

## Feature 10: Team Collaboration

### Overview

Multi-user access to projects within an organization. (Team plan)

### Access Model

- Organization owns projects
- Members have roles (Admin, Editor, Viewer)
- Admins manage membership
- Owner manages billing

### Collaboration Features

- Shared analysis results visible to all members
- Comments on findings (Team+)
- @mention team members in advisor chat
- Assign findings to members
- Activity feed: "Sarah resolved FINDING-42"

---

## Feature 11: API Access

### Overview

REST API for programmatic access to analyses and findings. (Pro+)

### Endpoints (v1)

```
GET    /v1/projects
POST   /v1/projects
GET    /v1/projects/:id
DELETE /v1/projects/:id

GET    /v1/projects/:id/analyses
POST   /v1/projects/:id/analyses        (trigger analysis)
GET    /v1/analyses/:id
GET    /v1/analyses/:id/findings
GET    /v1/analyses/:id/modules/:module

GET    /v1/projects/:id/score
```

### Authentication

API keys with `Bearer` token in `Authorization` header.

---

## Feature 12: Webhooks and Integrations

### Outbound Webhooks

Users configure webhooks to receive events:

- `analysis.started`
- `analysis.completed`
- `analysis.failed`
- `finding.created`
- `score.changed`

### GitHub Push Integration (Pro+)

- Connect GitHub webhook
- Automatically trigger analysis on push to selected branch
- Configurable: only analyze if significant code changes detected

### Linear Integration (Team+)

- "Push to Linear" button on findings
- Creates Linear issue with:
  - Finding title and description
  - Priority mapping (Critical → Urgent, High → High, etc.)
  - AI CTO label
  - Link back to finding

---

## Feature 13: Subscription and Billing

### Overview

Stripe-powered subscription management.

### User-Facing Flows

**Upgrade:**

1. User clicks "Upgrade" or hits a paywall
2. Plan comparison modal shown
3. User selects plan
4. Stripe Checkout or embedded payment form
5. Subscription activated immediately
6. Welcome email sent

**Self-Serve Portal:**

- Accessible from Settings → Billing
- Powered by Stripe Customer Portal
- Actions: upgrade, downgrade, cancel, update payment method, download invoices

**Downgrade / Cancellation:**

- Takes effect at end of current billing period
- Data retained for 30 days post-cancellation
- Re-subscribe at any time, data restored

**Paywall Experience:**

- Clear, contextual message explaining what the limit is
- Side-by-side plan comparison
- CTA: "Upgrade to Pro — $29/month"
- No dark patterns; easy to dismiss without upgrading
