# Phase 5 — Team Features Tasks

## TASK-086: Organizations Data Model and Clerk Org Sync

**Phase:** 5 — Team Features
**Priority:** Critical
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Implement the organizational data model and sync Clerk Organizations to the database.

### Requirements

- Clerk Organizations enabled in Clerk dashboard
- Webhook handlers for:
  - `organization.created` → create organization record
  - `organization.updated` → update organization record
  - `organization.deleted` → soft-delete organization
  - `organizationMembership.created` → add member record
  - `organizationMembership.deleted` → remove member record
  - `organizationMembership.updated` → update role
- All project queries updated to support both `userId` and `organizationId` ownership
- Auth context includes active organization

### Dependencies

- TASK-004, TASK-003

### Acceptance Criteria

- [ ] Organization created in database when created in Clerk
- [ ] Member records stay in sync with Clerk
- [ ] Projects can be owned by organizations
- [ ] User's personal projects remain separate from org projects

---

## TASK-087: Organization Creation and Management

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users to create and manage organizations.

### Requirements

- "Create Team" option in app navigation
- Organization setup: name, slug, logo upload
- Organization settings page: name, logo, slug, danger zone
- Switch between personal and organization context in app
- Organization switcher in top nav (like Linear's org switcher)
- Owner can delete organization (with confirmation + data retention warning)

### Dependencies

- TASK-086, TASK-006

### Acceptance Criteria

- [ ] Organization creation flow works end-to-end
- [ ] Context switcher updates all views to org context
- [ ] Organization settings save correctly

---

## TASK-088: Member Invite Flow

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow organization owners and admins to invite members.

### Requirements

- Invite by email address
- Invite email sent via Resend
- Invitation expires in 7 days
- Invitee clicks link → lands on accept invitation page
- If invitee has no account: sign up then accept
- If invitee has account: sign in then accept
- Pending invitations shown in members settings
- Cancel pending invitation
- Re-send invitation

### Dependencies

- TASK-086, TASK-025

### Acceptance Criteria

- [ ] Invite email received within 1 minute
- [ ] Accept flow works for new and existing users
- [ ] Expired invitations show clear error
- [ ] Pending invitations visible to admin

---

## TASK-089: RBAC Implementation

**Phase:** 5 — Team Features
**Priority:** Critical
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Implement role-based access control for organizations.

### Requirements

- Roles: Owner, Admin, Editor, Viewer
- Permission matrix (see `security.md`)
- `src/lib/auth/permissions.ts` — permission checking utilities
- All org-scoped API routes check permissions
- UI elements hidden/shown based on permissions
- Role shown in team member list
- Admin can change member roles (except own)
- Owner role is unique per organization

### Implementation Notes

```typescript
// lib/auth/permissions.ts
type Permission =
  | 'project:create' | 'project:delete'
  | 'analysis:trigger'
  | 'member:invite' | 'member:remove'
  | 'billing:manage'
  | ...;

async function checkPermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<boolean> { ... }
```

### Dependencies

- TASK-086

### Acceptance Criteria

- [ ] Viewer cannot trigger analysis (403)
- [ ] Admin cannot manage billing (403)
- [ ] Owner has all permissions
- [ ] UI correctly hides actions per role

---

## TASK-090: Team Dashboard

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Create the organization-level dashboard showing all projects.

### Requirements

- All organization projects in one view
- Aggregate stats: total projects, average score, critical findings count
- Sort/filter by: score, last analyzed, name
- Team member activity summary
- Quick actions: analyze any project, view report
- Organization health score (average of all project scores)

### Dependencies

- TASK-087, TASK-018

### Acceptance Criteria

- [ ] Shows all org projects regardless of who created them
- [ ] Aggregate stats are accurate
- [ ] Sorting and filtering work

---

## TASK-091: Team Activity Feed

**Phase:** 5 — Team Features
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Show a real-time activity feed of team actions.

### Requirements

- Feed events:
  - "[User] ran an analysis on [Project]"
  - "[User] resolved [N] findings in [Project]"
  - "[User] created project [Name]"
  - "[User] exported a report for [Project]"
  - "[User] invited [Email] to the team"
  - "New critical finding in [Project]"
- Feed visible to all team members
- Filterable by: user, project, event type
- Pagination (load more)
- Real-time updates (SSE or polling)

### Dependencies

- TASK-090

### Acceptance Criteria

- [ ] All listed events appear in feed
- [ ] Filter by user works
- [ ] New events appear without page refresh

---

## TASK-092: Finding Comments and @Mentions

**Phase:** 5 — Team Features
**Priority:** Medium
**Estimated Effort:** 1.5 days
**Status:** Backlog

### Objective

Allow team members to comment on findings and mention each other.

### Requirements

- Comment thread on each finding (expands below finding card)
- Markdown support in comments
- @mention: type @ → show team member picker
- Mentioned user receives in-app and email notification
- Edit own comments (up to 15 minutes)
- Delete own comments
- Comment count shown on finding card

### Dependencies

- TASK-020, TASK-086

### Acceptance Criteria

- [ ] Comments thread renders correctly
- [ ] @mention picker shows team members
- [ ] Mentioned user receives notification
- [ ] Markdown renders in comments

---

## TASK-093: Assign Findings to Team Members

**Phase:** 5 — Team Features
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow findings to be assigned to specific team members.

### Requirements

- Assign button on each finding
- Select from team member list
- Assigned member sees assigned findings in their personal view
- Filter findings by: "Assigned to me"
- Assignee notified by email and in-app
- "My Assignments" section in team dashboard

### Dependencies

- TASK-020, TASK-086

### Acceptance Criteria

- [ ] Assignment persists correctly
- [ ] "Assigned to me" filter works
- [ ] Assignee receives notification
- [ ] Assignment visible in finding card

---

## TASK-094: Slack Notification Integration

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Send team notifications to Slack channels.

### Requirements

- Slack OAuth for workspace connection
- Select notification channel per organization
- Notification events (configurable):
  - Analysis completed (with score and summary)
  - Critical finding detected
  - Weekly digest summary
  - Team member resolved N findings
- Rich Slack message formatting (Block Kit)
- Disconnect Slack option

### Implementation Notes

- Use Slack Bolt for Node.js or Slack Web API directly
- Store Slack bot token encrypted in database
- Test with Slack test workspace

### Dependencies

- TASK-086

### Acceptance Criteria

- [ ] Slack OAuth flow works
- [ ] Analysis complete notification sent to Slack within 60 seconds
- [ ] Messages are well-formatted (not just plain text)
- [ ] Users can configure which events to receive

---

## TASK-095: Outbound Webhooks System

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Allow Team+ users to configure outbound webhooks to receive AI CTO events.

### Requirements

- Create webhook: URL, event types, optional secret
- Supported events: `analysis.completed`, `analysis.failed`, `finding.created`, `score.changed`
- Delivery: POST with JSON payload and HMAC signature header
- Retry: 3 retries with exponential backoff
- Delivery logs: last 100 deliveries per webhook
- Active/inactive toggle
- Test delivery button (sends fake event)

### Dependencies

- TASK-086, TASK-011

### Acceptance Criteria

- [ ] Webhook receives events within 30 seconds of trigger
- [ ] HMAC signature is correct and verifiable
- [ ] Failed deliveries are retried
- [ ] Delivery logs show status and response

---

## TASK-096: Webhook Delivery Logs

**Phase:** 5 — Team Features
**Priority:** Medium
**Estimated Effort:** 0.5 days
**Status:** Backlog

### Objective

Provide visibility into webhook delivery history.

### Requirements

- Per-webhook delivery log table
- Columns: timestamp, event type, status (success/failed), response code, duration
- Show response body on click (truncated)
- Retry failed delivery button
- Automatic cleanup: keep last 100 deliveries per webhook

### Dependencies

- TASK-095

### Acceptance Criteria

- [ ] All deliveries logged
- [ ] Retry button triggers re-delivery
- [ ] Old deliveries automatically pruned

---

## TASK-097: Scheduled Analysis

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow Team+ users to schedule automatic re-analysis.

### Requirements

- Per-project schedule: weekly or monthly
- Day/time selection for weekly (e.g., "Every Monday at 9 AM")
- Timezone aware
- Vercel Cron triggers the schedule checker
- Respects rate limits and plan limits
- Notification: "Scheduled analysis for [Project] completed"
- Skip if analysis already ran within the last 3 days

### Dependencies

- TASK-011, TASK-086

### Acceptance Criteria

- [ ] Analysis triggers at configured time
- [ ] Timezone conversion is correct
- [ ] Skip logic works for recent analyses
- [ ] User receives notification

---

## TASK-098: Team Billing

**Phase:** 5 — Team Features
**Priority:** Critical
**Estimated Effort:** 2 days
**Status:** Backlog

### Objective

Handle billing at the organization level.

### Requirements

- Organization subscriptions (separate from personal)
- Team plan product and price in Stripe
- Billing owner: the organization Owner
- Per-seat pricing consideration (future) vs. flat team pricing (MVP)
- Invoice addresses the organization name
- Subscription management via Stripe Customer Portal
- Upgrades/downgrades handled correctly

### Dependencies

- TASK-022, TASK-086

### Acceptance Criteria

- [ ] Organization can subscribe to Team plan
- [ ] Billing is attributed to organization, not individual
- [ ] Stripe Customer Portal works for org billing
- [ ] Plan features activated correctly for all org members

---

## TASK-099: Team Onboarding Flow

**Phase:** 5 — Team Features
**Priority:** High
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Create a smooth first-experience for new team accounts.

### Requirements

- Post-organization-creation flow:
  - Step 1: Invite your team (invite by email)
  - Step 2: Import projects (from GitHub org or personal repos)
  - Step 3: Run your first team analysis
  - Step 4: Set up Slack notifications (optional)
- Progress tracking (skip available)
- Checklist shown in team dashboard until completed

### Dependencies

- TASK-087, TASK-088, TASK-094

### Acceptance Criteria

- [ ] All 4 steps are completable
- [ ] Skip works at each step
- [ ] Checklist shows completion progress
- [ ] Completing all steps gives a subtle celebration

---

## TASK-100: Notification Preferences UI

**Phase:** 5 — Team Features
**Priority:** Medium
**Estimated Effort:** 1 day
**Status:** Backlog

### Objective

Allow users and organizations to configure notification preferences.

### Requirements

- User-level preferences:
  - Analysis complete: in-app, email
  - Critical finding: in-app, email
  - Weekly digest: email
  - Team mentions: in-app, email
  - Subscription events: email (non-disableable)

- Organization-level preferences (admin):
  - Analysis complete: Slack channel
  - Critical finding: Slack channel
  - Weekly team digest: Slack channel
  - Member activity: in-app feed (on/off)

- Clear on/off toggles per channel (in-app, email, Slack)

### Dependencies

- TASK-094, TASK-024

### Acceptance Criteria

- [ ] All notification types have on/off controls
- [ ] Settings persist correctly
- [ ] Notifications respect preferences
- [ ] Billing notifications cannot be disabled
