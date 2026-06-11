# Coding Standards

## TypeScript Standards

### Strict Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type Definitions

**Prefer type over interface for object shapes:**

```typescript
// ✓ Preferred
type Project = {
  id: string;
  name: string;
  score: number | null;
};

// ✓ Use interface only when extending or implementing
interface AnalysisModule extends BaseModule {
  run(): Promise<ModuleResult>;
}
```

**Never use `any`. Use `unknown` for truly unknown types:**

```typescript
// ✓
function parseJson(input: string): unknown {
  return JSON.parse(input);
}

// ✗
function parseJson(input: string): any { ... }
```

**Prefer discriminated unions for state:**

```typescript
// ✓
type AnalysisState =
  | { status: "queued" }
  | { status: "running"; progress: number; currentModule: string }
  | { status: "complete"; score: number }
  | { status: "failed"; error: string };
```

### Enums vs String Unions

Prefer string unions over TypeScript enums (enums have runtime overhead and produce confusing compiled output):

```typescript
// ✓
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// ✗ (avoid unless you need reverse mapping)
enum Severity { Critical = 'critical', ... }
```

For database-level enums, use Prisma's enum type which maps to PostgreSQL enums.

---

## React and Next.js Standards

### Component Structure

```typescript
// Standard component file layout:

// 1. Imports (external → internal, types last)
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { Project } from '@/features/projects/types';

// 2. Types/interfaces for this component
type ProjectCardProps = {
  project: Project;
  onAnalyze: (id: string) => void;
};

// 3. Component (named export preferred over default)
export function ProjectCard({ project, onAnalyze }: ProjectCardProps) {
  // 3a. Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // 3b. Derived values / memos
  const scoreColor = getScoreColor(project.latestScore);

  // 3c. Event handlers
  function handleAnalyzeClick() {
    onAnalyze(project.id);
  }

  // 3d. Render
  return (
    <Card>
      ...
    </Card>
  );
}
```

### Server vs. Client Components

**Server Component (default, no directive):**

```typescript
// app/(app)/dashboard/page.tsx
// No 'use client' — fetches data on server

import { getProjects } from '@/features/projects/queries';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  const projects = await getProjects(userId!);

  return <ProjectList projects={projects} />;
}
```

**Client Component (only when needed):**

```typescript
"use client";
// Only add when you need: useState, useEffect, event listeners,
// browser APIs, or any client-side interactivity
```

**Rule:** If you are adding `'use client'` to a page or large component, reconsider. Extract only the interactive part to a client component.

### Server Actions

```typescript
// features/projects/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createProjectSchema = z.object({
  githubUrl: z.string().url(),
  branch: z.string().default("main"),
});

export async function createProject(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = createProjectSchema.parse({
    githubUrl: formData.get("githubUrl"),
    branch: formData.get("branch"),
  });

  // ... create project
  revalidatePath("/dashboard");
}
```

---

## API Route Standards

### Route Handler Structure

```typescript
// app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getProject } from "@/features/projects/queries";

// Type the params
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  // 2. Validate params
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid project ID" } },
      { status: 400 }
    );
  }

  // 3. Fetch data (always scoped to userId)
  const project = await getProject(id, userId);
  if (!project) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  // 4. Return response
  return NextResponse.json({ data: project });
}
```

### Input Validation Pattern

```typescript
const inputSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  githubUrl: z.string().url().startsWith("https://github.com/"),
});

const parsed = inputSchema.safeParse(await req.json());
if (!parsed.success) {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
    { status: 400 }
  );
}

const { name, githubUrl } = parsed.data;
```

---

## Database Query Standards

### Query Functions

```typescript
// features/projects/queries.ts

import { db } from "@/lib/db";
import type { Project } from "@/features/projects/types";

// Always scope by userId or organizationId
export async function getProjects(userId: string): Promise<Project[]> {
  return db.project.findMany({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

// Return null for missing resources (never throw for 404)
export async function getProject(id: string, userId: string): Promise<Project | null> {
  return db.project.findFirst({
    where: { id, userId, status: "active" },
  });
}
```

### Parallel Queries

```typescript
// ✓ Parallel fetching
const [project, analyses, members] = await Promise.all([
  getProject(id, userId),
  getAnalyses(id),
  getTeamMembers(orgId),
]);

// ✗ Sequential (slow)
const project = await getProject(id, userId);
const analyses = await getAnalyses(id);
const members = await getTeamMembers(orgId);
```

---

## Error Handling Standards

### Application Errors

Define typed error classes:

```typescript
// lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Authentication required", "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Access denied", "FORBIDDEN", 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}
```

### Async Error Handling

```typescript
// ✓ Explicit error handling
async function runAnalysis(projectId: string): Promise<Result> {
  try {
    const repo = await fetchRepository(projectId);
    const results = await analyzeRepository(repo);
    return { success: true, data: results };
  } catch (error) {
    logger.error("Analysis failed", { projectId, error });
    return { success: false, error: "Analysis failed" };
  }
}
```

---

## Naming Conventions

### Variables and Functions

```typescript
// camelCase for variables and functions
const projectId = 'abc123';
function calculateScore(modules: ModuleResult[]): number { ... }

// PascalCase for types, interfaces, classes, components
type AnalysisResult = { ... };
class AnalysisWorker { ... }
function ProjectCard() { ... }

// SCREAMING_SNAKE_CASE for constants
const MAX_FILE_SIZE_MB = 50;
const ANALYSIS_MODULES = ['architecture', 'security'] as const;
```

### Boolean Variables

Always prefix with `is`, `has`, `can`, `should`:

```typescript
// ✓
const isLoading = true;
const hasAnalysis = project.analysisCount > 0;
const canRunAnalysis = user.plan !== "free" || usageCount < 2;

// ✗
const loading = true;
const analysis = project.analysisCount > 0;
```

### Event Handlers

Always prefix with `handle` (in component) or `on` (in props):

```typescript
// Props
type Props = {
  onAnalyze: () => void;
  onDelete: (id: string) => void;
};

// Component internals
function handleAnalyzeClick() {
  onAnalyze();
}
```

---

## Import Order

Enforced by ESLint. Order:

1. External packages (`react`, `next/*`, etc.)
2. Internal absolute imports (`@/lib/*`, `@/features/*`)
3. Relative imports (`./component`, `../utils`)
4. Type imports (last, with `import type`)

```typescript
// ✓
import { useState } from "react";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getProject } from "@/features/projects/queries";

import { formatScore } from "./utils";

import type { Project } from "@/features/projects/types";
```

---

## Comments Policy

Comments explain **why**, not **what**. Well-named code explains itself.

```typescript
// ✓ Explains a non-obvious constraint
// GitHub's API returns a max of 1000 items per page; we cap at 500
// to leave room for recursive tree expansion.
const MAX_TREE_ITEMS = 500;

// ✓ Documents a workaround
// Clerk's getAuth() returns null in middleware for streaming routes;
// use headers() to extract the user ID directly in this context.
const userId = request.headers.get("x-clerk-user-id");

// ✗ Describes what the code obviously does
// Increment the counter
count++;
```

No multi-line comment blocks. No function docstrings describing parameters (use TypeScript types for that).
