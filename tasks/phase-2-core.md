# Phase 2 — Core Product Tasks

## TASK-026: Performance Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Implement the Performance analysis module.

### Requirements

- Detect N+1 query patterns in ORM code
- Identify missing database query optimization (no SELECT \*, missing pagination)
- Check for proper caching usage
- Detect unnecessary re-renders in React (missing useMemo, useCallback)
- Check image optimization (next/image usage, format)
- Identify synchronous blocking operations in async contexts
- Check for large bundle indicators (dynamic imports, code splitting)

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Identifies N+1 patterns in ORM code samples
- [ ] Does not false-positive on properly optimized code
- [ ] Handles both frontend and backend performance concerns
- [ ] Output validates against module schema

---

## TASK-027: Testing Coverage Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Evaluate the testing strategy and coverage quality.

### Requirements

- Detect test files and testing framework (Jest, Vitest, pytest, etc.)
- Estimate coverage level (low/medium/high based on test file ratio)
- Check if CI runs tests
- Identify untested critical paths (auth, payments, core business logic)
- Check test quality (not just existence): meaningful assertions
- Identify missing test types (unit vs. integration vs. E2E)

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Correctly detects projects with no tests
- [ ] Identifies CI test configuration
- [ ] Produces actionable recommendations for adding tests
- [ ] Does not over-praise low-quality test files

---

## TASK-028: Documentation Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Evaluate project documentation completeness.

### Requirements

- Check README quality and completeness (setup instructions, features, etc.)
- Check for API documentation
- Check for architecture documentation
- Check for CONTRIBUTING guide
- Check for CHANGELOG
- Check inline code documentation quality
- Check for user-facing help documentation

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Correctly evaluates README quality
- [ ] Identifies missing critical documentation sections
- [ ] Output is concise (documentation module should produce fewer findings)

---

## TASK-029: API Design Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Evaluate the quality and consistency of API design.

### Requirements

- Analyze REST API routes for naming consistency
- Check HTTP method semantics
- Evaluate error response format consistency
- Check for input validation presence
- Check for pagination on list endpoints
- Check for API versioning strategy
- Identify missing rate limiting
- Check for CORS configuration

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Identifies inconsistent naming in REST routes
- [ ] Flags endpoints missing input validation
- [ ] Produces specific endpoint-level findings

---

## TASK-030: Database Design Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Evaluate database schema design and data access patterns.

### Requirements

- Analyze ORM schema files (Prisma schema, SQLAlchemy models, etc.)
- Evaluate normalization (appropriate denormalization vs. over-normalization)
- Identify missing indexes on commonly queried fields
- Detect N+1 patterns in data access code
- Check migration management approach
- Evaluate connection pooling configuration
- Identify sensitive data that should be encrypted

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Correctly parses Prisma schema files
- [ ] Identifies missing indexes
- [ ] Identifies unencrypted sensitive fields

---

## TASK-031: DevOps and CI/CD Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Evaluate DevOps maturity and deployment practices.

### Requirements

- Check for CI/CD pipeline (GitHub Actions, GitLab CI, CircleCI, etc.)
- Evaluate deployment automation
- Check environment configuration management
- Check for Docker usage and quality
- Identify secrets in configuration files
- Check for monitoring/alerting setup
- Evaluate rollback capability
- Check for staging/production environment separation

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Correctly parses GitHub Actions YAML files
- [ ] Identifies missing CI pipeline
- [ ] Detects secrets in config files (false positive safe)

---

## TASK-032: SaaS Maturity Analysis Module

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Evaluate how complete the project is as a commercial SaaS product.

### Requirements

Checklist-driven analysis looking for:

- User authentication and account management
- Subscription and billing infrastructure
- Plan limits and enforcement
- Multi-tenancy support
- Admin tooling
- Usage tracking
- API access for power users
- Webhook support
- Email notification system
- Customer feedback mechanism
- Status page / incident communication
- Rate limiting
- Audit logging

### Implementation Notes

This module is highly valuable as its output directly tells founders what's missing from their SaaS. Use a structured checklist approach with severity based on business impact.

### Dependencies

- TASK-010, TASK-011

### Acceptance Criteria

- [ ] Identifies missing billing integration
- [ ] Identifies missing admin tools
- [ ] Produces business-impact framing for each finding
- [ ] Works well for both early-stage and mature projects

---

## TASK-033: AI CTO Advisor Chat Interface

**Phase:** 2 — Core Product
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Build the conversational AI interface for follow-up questions about the analysis.

### Requirements

- Chat panel accessible from project view (right sidebar or modal)
- Message input with submit (Enter key + button)
- Message history display (user messages + AI responses)
- Markdown rendering for AI responses
- Code block rendering with syntax highlighting
- "New conversation" button
- Suggested prompts shown when conversation is empty
- Conversation title auto-generated from first message
- Loading indicator during AI response

### Design

- Sticky bottom input area
- Message bubbles: user right-aligned, AI left-aligned
- Minimal, clean — avoid chat bubble "social media" feel
- AI responses feel like reading a senior engineer's notes

### Dependencies

- TASK-018, TASK-003

### Acceptance Criteria

- [ ] Chat renders correctly on all screen sizes
- [ ] Markdown renders in AI responses
- [ ] Code blocks have syntax highlighting
- [ ] Suggested prompts are clickable and auto-fill input
- [ ] Conversation persists across page refreshes (for Pro+)

---

## TASK-034: Advisor Streaming Responses

**Phase:** 2 — Core Product
**Priority:** Critical
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Implement streaming AI responses in the Advisor chat.

### Requirements

- Route handler: `/api/advisor/chat`
- Uses Vercel AI SDK `streamText`
- Model: claude-sonnet-4-6 (fast, conversational)
- System context includes: latest analysis results, project metadata
- Streaming response via `useChat` hook from Vercel AI SDK
- Token usage tracked and stored
- Rate limiting: 30 messages/minute for Pro, 10/minute for Free

### Implementation Notes

```typescript
// app/api/advisor/chat/route.ts
import { streamText } from "ai";
import { createAdvisorSystemPrompt } from "@/lib/ai/prompts/advisor";

export async function POST(req: Request) {
  const { messages, projectId } = await req.json();
  const analysis = await getLatestAnalysis(projectId);

  const result = streamText({
    model: gateway("claude-sonnet-4-6"),
    system: createAdvisorSystemPrompt(analysis),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Dependencies

- TASK-033

### Acceptance Criteria

- [ ] Responses stream character-by-character
- [ ] System prompt includes analysis context
- [ ] Rate limiting works correctly
- [ ] Token usage is tracked per conversation

---

## TASK-035: Advisor Conversation History

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Persist and display conversation history across sessions.

### Requirements

- Conversations saved to `advisor_conversations` and `advisor_messages` tables
- Conversation list in sidebar (for Pro+)
- Load previous conversation on click
- "New Conversation" creates fresh context
- Conversation title shown (first message truncated to 40 chars)
- Delete conversation option

### Dependencies

- TASK-034, TASK-003

### Acceptance Criteria

- [ ] Conversations persist after browser refresh
- [ ] Free users see only the current conversation (no history)
- [ ] Pro users see conversation list with titles
- [ ] Delete conversation works correctly

---

## TASK-036: Suggested Advisor Prompts

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Show context-aware suggested prompts in the advisor.

### Requirements

- Display 3–4 suggested prompts when advisor is empty
- Prompts are dynamically generated based on:
  - Top critical finding type → "How do I fix [critical issue]?"
  - Module with lowest score → "What's the most important thing in [module]?"
  - Missing SaaS features → "How should I add [missing feature]?"
  - General → "What should I prioritize before launch?"
- Clicking a prompt fills input and submits

### Implementation Notes

- Generate suggestions server-side based on analysis results
- Return as part of project analysis data

### Dependencies

- TASK-033

### Acceptance Criteria

- [ ] Suggestions are specific to the project's analysis
- [ ] All 4 suggestions are relevant and different
- [ ] Clicking suggestion submits immediately
- [ ] Suggestions hidden after first message is sent

---

## TASK-037: PDF Report Generation

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Generate professional PDF reports from analysis results.

### Requirements

- PDF includes: cover page, executive summary, SaaS Score, all findings
- Findings grouped by module with scores
- Recommendations section
- AI CTO branding
- Custom cover for Pro users (project name, date)
- Generated via Puppeteer/Playwright headless or @react-pdf/renderer
- Stored in Vercel Blob with download URL
- Cached: don't regenerate if analysis hasn't changed

### Implementation Notes

- Evaluate: `@react-pdf/renderer` (faster, no browser) vs. Puppeteer (more control)
- Recommendation: `@react-pdf/renderer` for MVP (simpler, works in Vercel Functions)
- PDF generation as a background job via queue

### Dependencies

- TASK-019, TASK-018

### Acceptance Criteria

- [ ] PDF generates within 15 seconds
- [ ] PDF renders correctly in Adobe Acrobat and browser
- [ ] All findings are included with formatting
- [ ] Download link works (signed Vercel Blob URL)
- [ ] Pro-only paywall enforced for PDF export

---

## TASK-038: Markdown Report Export

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Export analysis results as a Markdown file.

### Requirements

- Markdown export: clean, well-formatted Markdown
- Includes all sections: summary, score, findings grouped by module
- File name: `{project-name}-aicto-report-{date}.md`
- Download as file attachment

### Dependencies

- TASK-019

### Acceptance Criteria

- [ ] Markdown file is valid and well-formatted
- [ ] Renders correctly on GitHub
- [ ] All sections are included

---

## TASK-039: JSON Report Export

**Phase:** 2 — Core Product
**Priority:** Low
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Export analysis results as a structured JSON file for programmatic use.

### Requirements

- Full analysis results in JSON
- Includes: metadata, score, module scores, all findings with all fields
- Useful for: CI integration, custom tooling, API consumers

### Dependencies

- TASK-019

### Acceptance Criteria

- [ ] JSON is valid and well-structured
- [ ] All fields from database are included
- [ ] Download works as a file attachment

---

## TASK-040: Shareable Score Card (OG Image)

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Generate a shareable score card image for social media.

### Requirements

- Dynamically generated OG image using `@vercel/og`
- Shows: project name, SaaS Score, date, score label, "Analyzed by AI CTO"
- Used as `og:image` for public analysis pages
- Available as a "Share" button on analysis results
- Twitter card also supported

### Implementation Notes

- Use `@vercel/og` (ImageResponse) in a route handler
- Route: `/api/og/[analysisId]`
- Cache generated images

### Dependencies

- TASK-018

### Acceptance Criteria

- [ ] OG image renders correctly on Twitter and LinkedIn previews
- [ ] Score and label are accurate
- [ ] Generation takes <1 second

---

## TASK-041: Public Analysis Share Page

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create a public-accessible analysis results page for sharing.

### Requirements

- URL: `aicto.dev/s/[publicToken]`
- No authentication required to view
- Shows: score, executive summary, findings (can be limited)
- "Analyze your project" CTA for visitors
- SEO-optimized (meta tags, OG image)
- Can be disabled by the user
- User controls if full findings are shown or just score + summary

### Dependencies

- TASK-018, TASK-040

### Acceptance Criteria

- [ ] Page accessible without login
- [ ] OG preview image shows on social sharing
- [ ] "Analyze your repo" CTA works
- [ ] User can disable/enable the public link from settings

---

## TASK-042: Finding Management (Resolve/Dismiss)

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to track progress on findings.

### Requirements

- "Mark as Resolved" button on each finding
- "Dismiss" option with optional note (accepted risk)
- Resolved findings hidden by default, visible via filter toggle
- Resolution tracked in `findings` table with timestamp
- Resolved count shown in analysis header ("4 resolved")
- Bulk resolve option for multiple findings

### Dependencies

- TASK-020

### Acceptance Criteria

- [ ] Resolving a finding updates UI immediately (optimistic update)
- [ ] Resolved findings persist across sessions
- [ ] Filter toggle shows/hides resolved findings
- [ ] Bulk resolve works for selected findings

---

## TASK-043: Analysis History View

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to view and compare past analyses.

### Requirements

- List of all analyses for a project (newest first)
- Each entry: date, score, finding count delta, trigger type
- Score trend chart (line chart across analyses)
- Click analysis to view historical results
- Compare two analyses side-by-side (Post-MVP stretch goal)

### Dependencies

- TASK-018

### Acceptance Criteria

- [ ] All historical analyses listed correctly
- [ ] Score trend chart renders
- [ ] Historical analysis views work correctly

---

## TASK-044: Score Trend Chart

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Visualize score progression over time.

### Requirements

- Line chart: x-axis = date, y-axis = score (0–100)
- Data points: one per analysis
- Hover tooltip: date, score, delta
- Color gradient: red → green as score increases
- Empty state: "Run your first analysis to see trends"
- Library: Recharts or custom SVG

### Dependencies

- TASK-043

### Acceptance Criteria

- [ ] Chart renders with 2+ data points
- [ ] Tooltip shows correct data on hover
- [ ] Mobile responsive

---

## TASK-045: Project Re-Analysis Trigger

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Allow users to manually re-analyze a project at any time.

### Requirements

- "Run Analysis" button in project view
- Check if analysis already running (show progress, don't create duplicate)
- Check plan limits before triggering
- Confirm if previous analysis is recent (<24 hours): "Analysis was run 2 hours ago. Run again?"

### Dependencies

- TASK-011

### Acceptance Criteria

- [ ] Re-analysis triggers correctly
- [ ] Duplicate analysis is prevented
- [ ] Plan limits are checked
- [ ] Confirmation shown for recent analyses

---

## TASK-046: Weekly Digest Email

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Send weekly summary emails to Pro+ users.

### Requirements

- Sent every Monday 9 AM (user's timezone or UTC)
- Content: score change, new findings since last week, resolved findings, top recommendation
- Unsubscribe option
- Scheduled via Vercel Cron
- Only sent if user has at least 1 project with an analysis
- Opt-in by default for Pro+, opt-out for Free

### Dependencies

- TASK-025

### Acceptance Criteria

- [ ] Email sends at correct scheduled time
- [ ] Content is specific to user's projects
- [ ] Unsubscribe link works
- [ ] Not sent to users with no activity

---

## TASK-047: Mobile Responsive Design Audit

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Ensure the entire application is fully usable on mobile devices.

### Requirements

- Test all pages at 320px, 375px, 414px, 768px viewports
- Sidebar: collapsible on mobile (hamburger menu)
- Analysis results: cards stack vertically
- Finding detail: full-screen drawer on mobile
- Score display: appropriate sizing on small screens
- Navigation: accessible on touch

### Dependencies

- TASK-018, TASK-006

### Acceptance Criteria

- [ ] All core pages pass mobile review at 375px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets minimum 44×44px

---

## TASK-048: Animation and Micro-Interaction Polish

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Add premium-feeling animations and micro-interactions.

### Requirements

- Page transitions: fade + slide up (Framer Motion)
- Score count-up animation (first view)
- Module score bars: fill animation on page load
- Finding expand/collapse: smooth height animation
- Card hover: subtle lift (border brightening)
- Button press: scale down slightly
- Loading skeletons: shimmer animation
- AI streaming: text appearance animation

### Dependencies

- TASK-018, TASK-033

### Acceptance Criteria

- [ ] All animations run at 60fps
- [ ] `prefers-reduced-motion` disables animations
- [ ] No janky layout shifts during animation

---

## TASK-049: Onboarding Flow Improvements

**Phase:** 2 — Core Product
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Create a smooth first-run onboarding experience.

### Requirements

- Step 1: "Connect GitHub" (with benefits listed)
- Step 2: "Select your repository" (repo browser)
- Step 3: "Running your first analysis" (progress screen)
- Step 4: "Your results are ready" (redirect to results)
- Progress indicator: 4-step tracker
- Skip option after Step 1
- "What AI CTO analyzes" mini-explainer
- Confetti or celebration on first analysis complete

### Dependencies

- TASK-007, TASK-009, TASK-021

### Acceptance Criteria

- [ ] New users see onboarding on first login
- [ ] Returning users skip onboarding
- [ ] Onboarding can be resumed if interrupted
- [ ] Time-to-first-analysis under 2 minutes with onboarding

---

## TASK-050: Empty States and Error States Polish

**Phase:** 2 — Core Product
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create polished, helpful empty and error states for all views.

### Requirements

**Empty states needed:**

- Dashboard (no projects yet)
- Analysis results (never analyzed)
- Analysis history (first analysis only)
- Advisor (no conversation yet)
- Findings (no findings in a module — actually good!)

**Error states needed:**

- Analysis failed (with retry)
- GitHub disconnected (reconnect prompt)
- Rate limit hit (upgrade or wait)
- Network error (generic retry)

**Design:** Each empty state has: relevant illustration or icon, title, description, primary action button.

### Dependencies

- TASK-018, TASK-006

### Acceptance Criteria

- [ ] Every data-driven view has an empty state
- [ ] Every error state has an action (not a dead end)
- [ ] Empty states feel encouraging, not apologetic
