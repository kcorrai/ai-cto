# Development Rules

## The Golden Rule

> Code is read 10x more than it is written. Write for the next engineer, not for the machine.

These rules exist to keep the codebase maintainable for years. Every rule has a reason. If a rule seems wrong for a specific case, discuss and update the rule — don't silently break it.

---

## Architecture Rules

### AR-01: Feature-First Folder Structure

Organize code by feature/domain, not by technical layer.

```
✓ src/features/projects/
    components/
    hooks/
    actions.ts
    queries.ts
    types.ts

✗ src/components/ProjectCard.tsx
  src/hooks/useProject.ts
  src/types/project.ts
```

Exception: Shared UI components go in `src/components/ui/`. Shared utilities go in `src/lib/`.

### AR-02: No Barrel Files (index.ts re-exports)

Barrel files cause circular dependency issues and slow down TypeScript compilation.

```
✓ import { ProjectCard } from "@/features/projects/components/ProjectCard"
✗ import { ProjectCard } from "@/features/projects"
```

### AR-03: Server-First Data Fetching

All data fetching happens in Server Components or Server Actions by default. Only move to client-side fetching when there is an explicit interactivity requirement.

### AR-04: Database Access Only in Server Context

Database queries never run in Client Components or from the browser. Only in:

- Server Components
- Server Actions
- Route Handlers
- Worker functions

### AR-05: No Direct Database Access in Components

All database queries go through a query function in `queries.ts` or a Server Action in `actions.ts`. Components never import Prisma directly.

```
✓ // features/projects/queries.ts
  export async function getProject(id: string, userId: string) {
    return db.project.findFirst({ where: { id, userId } });
  }

✗ // components/ProjectCard.tsx
  import { db } from "@/lib/db"; // ← NEVER
```

### AR-06: Single Source of Truth for Types

Types are defined once:

- Database types: derived from Prisma schema (`Prisma.ProjectGetPayload<>`)
- API types: Zod schemas in route handlers
- UI types: Props inferred from Zod schemas or Prisma types

No duplicating type definitions.

### AR-07: Environment Variables Validated at Startup

All environment variables are defined and validated in `src/env.ts` using Zod. The application fails fast at startup if required variables are missing, not at runtime when a feature is used.

---

## Folder Structure Rules

### FS-01: Canonical Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public pages
│   ├── (auth)/             # Auth pages
│   ├── (app)/              # Protected app
│   └── api/                # Route handlers
├── features/               # Feature modules
│   ├── projects/
│   ├── analyses/
│   ├── advisor/
│   ├── reports/
│   └── billing/
├── components/
│   ├── ui/                 # shadcn/ui base components
│   └── shared/             # App-level shared components
├── lib/
│   ├── ai/                 # AI/LLM utilities and prompts
│   │   ├── prompts/        # Versioned prompt templates
│   │   └── modules/        # Analysis module implementations
│   ├── db/                 # Prisma client and utilities
│   ├── github/             # GitHub API client
│   ├── stripe/             # Stripe utilities
│   └── utils/              # General utilities
├── hooks/                  # Global React hooks
├── env.ts                  # Environment variable schema
└── middleware.ts            # Clerk auth middleware
```

### FS-02: File Naming Conventions

| Type              | Convention       | Example                        |
| ----------------- | ---------------- | ------------------------------ |
| React components  | PascalCase       | `ProjectCard.tsx`              |
| Utility functions | camelCase        | `formatScore.ts`               |
| Route handlers    | `route.ts`       | `app/api/projects/route.ts`    |
| Server actions    | `actions.ts`     | `features/projects/actions.ts` |
| Server queries    | `queries.ts`     | `features/projects/queries.ts` |
| Types             | `types.ts`       | `features/projects/types.ts`   |
| Hooks             | `use[Name].ts`   | `useProject.ts`                |
| Test files        | `[name].test.ts` | `formatScore.test.ts`          |

### FS-03: No `utils` God Files

Split utilities by concern. No single `utils.ts` file with 50 functions.

---

## Code Quality Rules

### CQ-01: TypeScript Strict Mode — Always

No exceptions. Configure `"strict": true` in tsconfig.json. No `any`. No `@ts-ignore` without a comment explaining exactly why.

### CQ-02: No `console.log` in Production Code

Use a structured logger (`src/lib/logger.ts`). `console.log` is a signal that code was not finished.

### CQ-03: All Functions Must Have a Single Responsibility

If you need to describe what a function does with "and", it should be split.

### CQ-04: Pure Functions Where Possible

Business logic functions should be pure (same inputs → same outputs, no side effects). Side effects are isolated to I/O boundaries (database calls, API calls, queue jobs).

### CQ-05: No Magic Numbers or Strings

Named constants for all business-rule values:

```
✓ const MAX_FREE_PROJECTS = 1;
  const ANALYSIS_TIMEOUT_MS = 300_000;

✗ if (projects.length >= 1) { ... }
  setTimeout(cleanup, 300000);
```

### CQ-06: Error Handling is Explicit

- Functions that can fail return a `Result<T, E>` type or throw typed errors
- Every `try/catch` block handles the error or re-throws with context
- Unhandled promise rejections are a CI failure

### CQ-07: No Commented-Out Code

Delete dead code. Git history preserves it if needed. Commented-out code is noise.

---

## Testing Rules

### TR-01: Test Coverage Requirements

| Code Type                       | Minimum Coverage        |
| ------------------------------- | ----------------------- |
| Business logic (pure functions) | 90%                     |
| Database queries                | 80% (integration tests) |
| API route handlers              | 80% (integration tests) |
| UI components                   | Key user flows via E2E  |
| Analysis modules                | 85%                     |

### TR-02: Test Types

- **Unit tests** (`*.test.ts`): Pure functions, utilities, transformations
- **Integration tests** (`*.integration.test.ts`): Database queries, external API calls
- **E2E tests** (`e2e/*.spec.ts`): Critical user flows (sign up, connect repo, run analysis, view results, upgrade)

### TR-03: No Mocking the Database

Integration tests use a real Neon test branch, not mocked database clients. Mocked databases mask schema and query bugs.

### TR-04: E2E Tests Cover All Critical Paths

Every path that generates revenue must have an E2E test:

- Sign up → connect GitHub → create project → run analysis
- Free → upgrade to Pro (via Stripe test mode)
- Analysis complete → view findings → mark resolved
- Team invite flow

### TR-05: Tests Are Independent

No test depends on another test running first. Each test seeds its own data and cleans up after itself.

---

## Security Rules

### SR-01: Never Trust Client Input

Every API route validates all inputs with Zod before processing. No exceptions.

### SR-02: Authorization Before Every Sensitive Operation

Every route that accesses a resource must verify ownership or membership before returning data. No relying on IDs being unguessable.

### SR-03: No Secrets in Code

No API keys, tokens, passwords, or connection strings in source code. Ever. These go in `.env.local` (development) or Vercel environment variables (production). A CI check scans for secret patterns on every PR.

### SR-04: GitHub Tokens Are Never Logged

Implement a custom serializer that redacts tokens before any logging. Audit every log statement that touches user or project objects.

### SR-05: Rate Limit Every Public Endpoint

Every endpoint accessible without authentication is rate-limited. Every authenticated endpoint is rate-limited by user ID.

### SR-06: Validate Webhook Signatures

Every inbound webhook (Stripe, GitHub, Clerk) must have its signature verified before any processing. Unverified webhooks return 401 immediately.

---

## AI/Prompt Rules

### AI-01: Prompts Are Code

Prompt templates live in version-controlled TypeScript files. No prompts hardcoded in route handlers or database.

### AI-02: All AI Outputs Are Validated

Every AI response is parsed through a Zod schema before being used. If parsing fails, the failure is logged and handled gracefully.

### AI-03: Prompt Versions Are Tracked

Each prompt template has a version comment. Changes to prompts require a git commit message explaining the change and expected outcome.

### AI-04: No Sensitive Data in Prompts

GitHub tokens, user emails, stripe keys — never in AI prompts. Only sanitized content and metadata.

### AI-05: Cost-Per-Analysis Is Tracked

Every analysis logs token counts per module. Alert if any analysis exceeds the budget threshold.

### AI-06: Prompts Are Tested

Critical analysis prompts have snapshot tests that verify the output schema for a set of known inputs.

---

## Database Rules

### DB-01: All Schema Changes via Prisma Migrate

No manual SQL on the production database. Ever. All changes go through Prisma migration files.

### DB-02: Migrations Are Reviewed

Every migration file requires review before merging. Migrations that add NOT NULL columns without a default or that drop data require explicit acknowledgment in the PR.

### DB-03: Never Use `findMany` Without a Where Clause or Limit

All list queries must be scoped to a user/organization and paginated.

```
✓ db.project.findMany({ where: { userId }, take: 20, skip: offset })
✗ db.project.findMany()
```

### DB-04: Include Foreign Key Indexes

Every FK column must have an index in the migration. Prisma does not add these automatically.

### DB-05: Sensitive Fields Are Encrypted Before Storage

GitHub tokens, webhook secrets, and any PII beyond email are encrypted at the application level before being passed to Prisma.

---

## API Rules

### API-01: Consistent Response Envelope

All API responses follow this structure:

```typescript
// Success
{ "data": { ... }, "meta": { ... } }

// Error
{ "error": { "code": "NOT_FOUND", "message": "Project not found" } }
```

### API-02: Consistent HTTP Status Codes

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| 200    | Success (GET, PUT)                             |
| 201    | Created (POST)                                 |
| 204    | Deleted (DELETE)                               |
| 400    | Validation error                               |
| 401    | Unauthenticated                                |
| 403    | Unauthorized (authenticated but not permitted) |
| 404    | Resource not found                             |
| 429    | Rate limited                                   |
| 500    | Server error                                   |

### API-03: No Waterfall Requests

API routes that need multiple pieces of data use `Promise.all()` for parallel fetching, not sequential awaits.

---

## UI Rules

### UI-01: No Inline Styles

All styles via Tailwind classes. No `style={{ ... }}` props (except when dynamically computed values are unavoidable — e.g., chart dimensions).

### UI-02: Dark Mode First

All components are built for dark mode first. Light mode is an override. Test both modes in CI via Playwright screenshots.

### UI-03: Loading and Empty States Are Required

Every data-driven component must implement:

- Loading skeleton (not just a spinner)
- Empty state (not just "no data")
- Error state with actionable message

### UI-04: No Raw Alert or Confirm Dialogs

Use the design system's `Dialog` and `AlertDialog` components. `window.alert()` and `window.confirm()` are forbidden.

### UI-05: All User-Facing Strings Are Reviewable

No string literals scattered through components. Use a constants file or localization setup for any string that might need updating.

---

## Code Review Rules

### CR-01: Every PR Has Tests

No PR that adds a feature ships without tests for that feature. Bug fixes should include a regression test.

### CR-02: No Self-Merges to Main

Every PR requires at least one review before merging (once team size > 1).

### CR-03: PR Size Limit

Target PRs under 400 lines of diff. Large PRs are harder to review and more likely to introduce bugs. Break large features into smaller, sequenced PRs.

### CR-04: CI Must Pass Before Merge

Merging a PR with failing CI is not allowed. Fix the CI, then merge.

### CR-05: Review Security Implications

Every PR review includes asking: "Could this introduce a security vulnerability?"
