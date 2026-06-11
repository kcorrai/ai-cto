# Database Schema

## Overview

PostgreSQL database hosted on Neon, accessed via Prisma ORM.

Design principles:

- UUIDs as primary keys (no sequential integer IDs exposed in URLs)
- `createdAt` / `updatedAt` on every table
- Soft deletes (`deletedAt`) on user-facing entities
- Row-level scoping: every query is scoped to `userId` or `organizationId`
- Separate `metadata` JSONB column for extensible attributes

---

## Tables

### `users`

Synced from Clerk via webhook on sign-up and user update.

```sql
users
├── id              UUID PK DEFAULT gen_random_uuid()
├── clerkId         VARCHAR(255) UNIQUE NOT NULL
├── email           VARCHAR(255) UNIQUE NOT NULL
├── name            VARCHAR(255)
├── avatarUrl       TEXT
├── plan            ENUM('free','pro','team','enterprise') DEFAULT 'free'
├── stripeCustomerId VARCHAR(255) UNIQUE
├── githubUsername  VARCHAR(255)
├── githubAccessToken TEXT                  -- encrypted
├── githubTokenScope TEXT
├── settings        JSONB DEFAULT '{}'      -- user preferences
├── onboardingStep  INT DEFAULT 0
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
├── updatedAt       TIMESTAMPTZ DEFAULT NOW()
└── deletedAt       TIMESTAMPTZ
```

**Indexes:** `clerkId`, `email`, `stripeCustomerId`

---

### `organizations`

Team/Enterprise accounts. A user can belong to multiple orgs.

```sql
organizations
├── id              UUID PK DEFAULT gen_random_uuid()
├── clerkOrgId      VARCHAR(255) UNIQUE NOT NULL
├── name            VARCHAR(255) NOT NULL
├── slug            VARCHAR(255) UNIQUE NOT NULL
├── plan            ENUM('team','enterprise') DEFAULT 'team'
├── stripeCustomerId VARCHAR(255) UNIQUE
├── maxProjects     INT DEFAULT 20
├── maxMembers      INT DEFAULT 10
├── settings        JSONB DEFAULT '{}'
├── logoUrl         TEXT
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
├── updatedAt       TIMESTAMPTZ DEFAULT NOW()
└── deletedAt       TIMESTAMPTZ
```

---

### `organization_members`

Many-to-many between users and organizations.

```sql
organization_members
├── id              UUID PK DEFAULT gen_random_uuid()
├── organizationId  UUID FK → organizations.id
├── userId          UUID FK → users.id
├── role            ENUM('owner','admin','editor','viewer') DEFAULT 'viewer'
├── invitedBy       UUID FK → users.id
├── joinedAt        TIMESTAMPTZ DEFAULT NOW()
└── createdAt       TIMESTAMPTZ DEFAULT NOW()
```

**Unique constraint:** `(organizationId, userId)`

---

### `subscriptions`

Stripe subscription tracking.

```sql
subscriptions
├── id                  UUID PK DEFAULT gen_random_uuid()
├── userId              UUID FK → users.id (nullable if org)
├── organizationId      UUID FK → organizations.id (nullable if user)
├── stripeSubscriptionId VARCHAR(255) UNIQUE NOT NULL
├── stripePriceId       VARCHAR(255) NOT NULL
├── status              ENUM('active','past_due','canceled','trialing','incomplete','paused')
├── plan                ENUM('free','pro','team','enterprise')
├── currentPeriodStart  TIMESTAMPTZ
├── currentPeriodEnd    TIMESTAMPTZ
├── trialEnd            TIMESTAMPTZ
├── cancelAtPeriodEnd   BOOLEAN DEFAULT false
├── canceledAt          TIMESTAMPTZ
├── metadata            JSONB DEFAULT '{}'
├── createdAt           TIMESTAMPTZ DEFAULT NOW()
└── updatedAt           TIMESTAMPTZ DEFAULT NOW()
```

---

### `projects`

A project represents a connected repository or uploaded codebase.

```sql
projects
├── id              UUID PK DEFAULT gen_random_uuid()
├── userId          UUID FK → users.id (nullable if org-owned)
├── organizationId  UUID FK → organizations.id (nullable if user-owned)
├── name            VARCHAR(255) NOT NULL
├── slug            VARCHAR(255) NOT NULL
├── description     TEXT
├── type            ENUM('github','upload','url') DEFAULT 'github'
├── githubRepoId    BIGINT
├── githubOwner     VARCHAR(255)
├── githubRepo      VARCHAR(255)
├── githubBranch    VARCHAR(255) DEFAULT 'main'
├── githubUrl       TEXT
├── isPrivate       BOOLEAN DEFAULT false
├── language        VARCHAR(50)
├── framework       VARCHAR(50)
├── techStack       JSONB DEFAULT '[]'          -- detected technologies
├── lastAnalyzedAt  TIMESTAMPTZ
├── analysisCount   INT DEFAULT 0
├── latestScore     INT                         -- SaaS Score 0–100
├── autoAnalyze     BOOLEAN DEFAULT false       -- re-analyze on push
├── status          ENUM('active','archived','deleted') DEFAULT 'active'
├── settings        JSONB DEFAULT '{}'
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
├── updatedAt       TIMESTAMPTZ DEFAULT NOW()
└── deletedAt       TIMESTAMPTZ
```

**Unique constraint:** `(userId, slug)`, `(organizationId, slug)`
**Indexes:** `userId`, `organizationId`, `githubRepoId`, `status`

---

### `analyses`

Each time a project is analyzed, a record is created.

```sql
analyses
├── id              UUID PK DEFAULT gen_random_uuid()
├── projectId       UUID FK → projects.id
├── triggeredBy     UUID FK → users.id
├── trigger         ENUM('manual','auto','webhook','scheduled') DEFAULT 'manual'
├── status          ENUM('queued','fetching','analyzing','synthesizing','complete','failed')
├── progress        INT DEFAULT 0              -- 0–100 percentage
├── score           INT                        -- SaaS Score 0–100
├── scoreBreakdown  JSONB                      -- per-module scores
├── summary         TEXT                       -- AI executive summary
├── findings        JSONB DEFAULT '[]'         -- ordered list of findings
├── recommendations JSONB DEFAULT '[]'         -- prioritized actions
├── metadata        JSONB DEFAULT '{}'         -- repo metadata at time of analysis
├── modelUsed       VARCHAR(100)               -- which AI model ran synthesis
├── tokenCount      INT                        -- total tokens consumed
├── durationMs      INT                        -- total analysis duration
├── errorMessage    TEXT
├── blobPath        TEXT                       -- path to raw analysis in Vercel Blob
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
├── updatedAt       TIMESTAMPTZ DEFAULT NOW()
└── completedAt     TIMESTAMPTZ
```

**Indexes:** `projectId`, `status`, `createdAt DESC`

---

### `analysis_modules`

Individual module results within an analysis.

```sql
analysis_modules
├── id              UUID PK DEFAULT gen_random_uuid()
├── analysisId      UUID FK → analyses.id
├── module          ENUM('architecture','code_quality','security','performance',
│                        'testing','documentation','dependencies','api_design',
│                        'database','devops','product_readiness','saas_maturity')
├── status          ENUM('pending','running','complete','failed','skipped')
├── score           INT                        -- 0–100 module score
├── findings        JSONB DEFAULT '[]'
├── rawOutput       JSONB                      -- full AI response for this module
├── durationMs      INT
├── tokenCount      INT
├── errorMessage    TEXT
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

**Unique constraint:** `(analysisId, module)`

---

### `findings`

Normalized finding records (extracted from analyses.findings JSONB for querying).

```sql
findings
├── id              UUID PK DEFAULT gen_random_uuid()
├── analysisId      UUID FK → analyses.id
├── projectId       UUID FK → projects.id
├── module          VARCHAR(50)
├── severity        ENUM('critical','high','medium','low','info')
├── category        VARCHAR(100)
├── title           VARCHAR(500)
├── description     TEXT
├── recommendation  TEXT
├── effort          ENUM('low','medium','high')
├── impact          ENUM('low','medium','high')
├── filePath        TEXT                       -- relevant file if applicable
├── lineRange       VARCHAR(50)               -- e.g., "42-58"
├── isResolved      BOOLEAN DEFAULT false
├── resolvedAt      TIMESTAMPTZ
├── resolvedBy      UUID FK → users.id
├── metadata        JSONB DEFAULT '{}'
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:** `projectId`, `analysisId`, `severity`, `isResolved`

---

### `reports`

Generated report exports (PDF, Markdown, JSON).

```sql
reports
├── id              UUID PK DEFAULT gen_random_uuid()
├── analysisId      UUID FK → analyses.id
├── projectId       UUID FK → projects.id
├── generatedBy     UUID FK → users.id
├── type            ENUM('pdf','markdown','json','notion')
├── title           VARCHAR(255)
├── blobUrl         TEXT                       -- Vercel Blob URL
├── blobPath        TEXT
├── isPublic        BOOLEAN DEFAULT false
├── publicToken     VARCHAR(64) UNIQUE         -- for shareable link
├── downloadCount   INT DEFAULT 0
├── expiresAt       TIMESTAMPTZ
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

---

### `advisor_conversations`

AI Chat advisor session history.

```sql
advisor_conversations
├── id              UUID PK DEFAULT gen_random_uuid()
├── projectId       UUID FK → projects.id
├── userId          UUID FK → users.id
├── title           VARCHAR(255)
├── messageCount    INT DEFAULT 0
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

### `advisor_messages`

Individual messages in an advisor conversation.

```sql
advisor_messages
├── id              UUID PK DEFAULT gen_random_uuid()
├── conversationId  UUID FK → advisor_conversations.id
├── role            ENUM('user','assistant','system')
├── content         TEXT NOT NULL
├── tokenCount      INT
├── metadata        JSONB DEFAULT '{}'        -- tool calls, references, etc.
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

---

### `api_keys`

For Pro+ users to access the API.

```sql
api_keys
├── id              UUID PK DEFAULT gen_random_uuid()
├── userId          UUID FK → users.id
├── organizationId  UUID FK → organizations.id (nullable)
├── name            VARCHAR(255) NOT NULL
├── keyHash         VARCHAR(255) NOT NULL UNIQUE  -- bcrypt hash
├── keyPrefix       VARCHAR(20) NOT NULL           -- e.g. "aicto_live_..."
├── scopes          JSONB DEFAULT '["read"]'
├── lastUsedAt      TIMESTAMPTZ
├── expiresAt       TIMESTAMPTZ
├── revokedAt       TIMESTAMPTZ
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

---

### `webhooks`

User-configured outbound webhooks.

```sql
webhooks
├── id              UUID PK DEFAULT gen_random_uuid()
├── userId          UUID FK → users.id
├── organizationId  UUID FK → organizations.id (nullable)
├── projectId       UUID FK → projects.id (nullable — null = all projects)
├── url             TEXT NOT NULL
├── events          JSONB DEFAULT '[]'        -- ["analysis.completed", ...]
├── secret          TEXT NOT NULL             -- HMAC secret (encrypted at rest)
├── isActive        BOOLEAN DEFAULT true
├── failureCount    INT DEFAULT 0
├── lastDeliveredAt TIMESTAMPTZ
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

---

### `webhook_deliveries`

Log of webhook delivery attempts.

```sql
webhook_deliveries
├── id              UUID PK DEFAULT gen_random_uuid()
├── webhookId       UUID FK → webhooks.id
├── event           VARCHAR(100)
├── payload         JSONB
├── responseStatus  INT
├── responseBody    TEXT
├── durationMs      INT
├── success         BOOLEAN
├── attemptNumber   INT DEFAULT 1
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
└── updatedAt       TIMESTAMPTZ DEFAULT NOW()
```

---

### `audit_logs`

Immutable audit trail for sensitive operations.

```sql
audit_logs
├── id              UUID PK DEFAULT gen_random_uuid()
├── userId          UUID FK → users.id
├── organizationId  UUID FK → organizations.id (nullable)
├── action          VARCHAR(100) NOT NULL     -- e.g., "project.created"
├── resource        VARCHAR(100)              -- e.g., "project"
├── resourceId      UUID
├── metadata        JSONB DEFAULT '{}'
├── ipAddress       INET
├── userAgent       TEXT
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
```

**Note:** No `updatedAt`. Audit logs are immutable.

---

### `usage_events`

Usage tracking for billing metering.

```sql
usage_events
├── id              UUID PK DEFAULT gen_random_uuid()
├── userId          UUID FK → users.id
├── organizationId  UUID FK → organizations.id (nullable)
├── event           VARCHAR(100)              -- e.g., "analysis.run"
├── quantity        INT DEFAULT 1
├── metadata        JSONB DEFAULT '{}'
├── billingPeriod   VARCHAR(20)               -- e.g., "2025-01"
├── createdAt       TIMESTAMPTZ DEFAULT NOW()
```

---

## Relationships Summary

```
users ──────────────────────── organization_members ──── organizations
  │                                                              │
  ├── projects ──────────────────────────────────────── (org projects)
  │     │
  │     ├── analyses
  │     │     ├── analysis_modules
  │     │     └── findings
  │     │
  │     ├── reports
  │     ├── advisor_conversations
  │     │     └── advisor_messages
  │     └── webhooks
  │
  ├── subscriptions
  ├── api_keys
  ├── audit_logs
  └── usage_events
```

---

## Migration Strategy

- All migrations managed via Prisma Migrate
- Never run destructive migrations in production without a rollback plan
- Column renames are done as: add new column → backfill → remove old column (3 PRs)
- Neon branching used for schema testing before production migration
- Migrations are reviewed by at least one other engineer before merging
