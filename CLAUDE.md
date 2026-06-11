# AI CTO — Project State

## What This File Is

The single source of truth for build state.
Every session starts here. Every session ends by updating STATE.

---

## STATE

```
PHASE:        1 — MVP
ACTIVE TASK:  TASK-009
STATUS:       NOT STARTED
LAST UPDATED: 2026-06-11
BLOCKER:      none
LAST DONE:    TASK-008 (2026-06-11)
```

---

## Execution Loop

```
READ  → CLAUDE.md (this file)
FIND  → active task in tasks/TASKS.md
READ  → only the docs listed in that task's "Reads" field
BUILD → only what the task specifies
TEST  → verify all acceptance criteria pass
UPDATE→ STATE block above (mark done, set next active)
STOP
```

**Hard rules:**

- One task per session. No exceptions.
- A task is not done until every acceptance criterion is checked.
- Never read docs speculatively. Only read what the task references.
- Never start a task whose dependencies are not DONE.
- Never create new docs.

---

## Phase Map

| Phase            | Range               | Total | Done | State      |
| ---------------- | ------------------- | ----- | ---- | ---------- |
| 1 — MVP          | TASK-001 → TASK-025 | 25    | 1    | **ACTIVE** |
| 2 — Core Product | TASK-026 → TASK-050 | 25    | 0    | locked     |
| 3 — Advanced AI  | TASK-051 → TASK-070 | 20    | 0    | locked     |
| 4 — Growth       | TASK-071 → TASK-085 | 15    | 0    | locked     |
| 5 — Team         | TASK-086 → TASK-100 | 15    | 0    | locked     |
| 6 — Enterprise   | TASK-101 → TASK-115 | 15    | 0    | locked     |
| 7 — Platform     | TASK-116 → TASK-130 | 15    | 0    | locked     |

---

## Phase 1 Task Registry

| ID       | Title                        | State    | Depends On          |
| -------- | ---------------------------- | -------- | ------------------- |
| TASK-001 | Project scaffolding          | **DONE** | —                   |
| TASK-002 | Environment validation       | **DONE** | 001                 |
| TASK-003 | Database + Prisma            | **DONE** | 001 002             |
| TASK-004 | Clerk authentication         | **DONE** | 001 002 003         |
| TASK-005 | Marketing landing page       | **DONE** | 001 004             |
| TASK-006 | App shell + navigation       | **DONE** | 001 004             |
| TASK-007 | GitHub OAuth + token storage | **DONE** | 003 004             |
| TASK-008 | GitHub repo browser          | **DONE** | 007                 |
| TASK-009 | Project creation flow        | todo     | 007 008 003         |
| TASK-010 | Repository fetcher           | todo     | 007 003             |
| TASK-011 | Analysis job queue           | todo     | 003 010             |
| TASK-012 | Architecture analysis module | todo     | 010 011             |
| TASK-013 | Code quality module          | todo     | 010 011             |
| TASK-014 | Security analysis module     | todo     | 010 011             |
| TASK-015 | Dependencies module          | todo     | 010 011             |
| TASK-016 | Product readiness module     | todo     | 010 011             |
| TASK-017 | SaaS Score algorithm         | todo     | 012 013 014 015 016 |
| TASK-018 | Analysis results page        | todo     | 017 006             |
| TASK-019 | Executive summary (AI)       | todo     | 012 013 014 015 016 |
| TASK-020 | Finding cards + detail       | todo     | 018                 |
| TASK-021 | Analysis progress stream     | todo     | 011 018             |
| TASK-022 | Stripe + Pro plan            | todo     | 003 004             |
| TASK-023 | Plan limits enforcement      | todo     | 022 003             |
| TASK-024 | User settings page           | todo     | 004 007 022         |
| TASK-025 | Transactional email          | todo     | 004                 |

---

## Doc Index (Reference Only)

These docs are written. Do not modify them. Reference only when a task lists them.

| Doc                            | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| docs/architecture.md           | System design, folder structure, data flow    |
| docs/tech-stack.md             | Technology choices and rationale              |
| docs/database-schema.md        | All tables, columns, indexes, relationships   |
| docs/ai-system-design.md       | 12 analysis modules, SaaS Score, prompt rules |
| docs/security.md               | Auth, token handling, RBAC, rate limiting     |
| docs/design-system.md          | Colors, typography, components, spacing       |
| docs/monetization.md           | Plan tiers, limits, Stripe setup              |
| docs/feature-specifications.md | Feature-level UX and flow specs               |
| docs/coding-standards.md       | TypeScript, React, API patterns               |
| docs/development-rules.md      | Architecture, testing, security rules         |

All other docs/ files are strategic reference (vision, roadmap, etc.) — not needed during build.

---

## Session Commands

| You say                  | Claude does                          |
| ------------------------ | ------------------------------------ |
| `continue`               | Reads this file → starts active task |
| `status`                 | Reports STATE block only             |
| `start TASK-XXX`         | Checks deps → starts that task       |
| `block TASK-XXX: reason` | Marks task blocked, records reason   |
| `done TASK-XXX`          | Verifies criteria → updates STATE    |
