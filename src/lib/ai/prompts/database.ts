// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_500;

const DB_KEY_PATTERNS = [
  /schema\.prisma$/i,
  /models?\.(ts|js|py|rb)$/i,
  /migrations?\//i,
  /database\.(ts|js|py)$/i,
  /db\.(ts|js|py)$/i,
  /sqlalchemy/i,
  /\/(repositories?|daos?)\//i,
  /requirements\.txt$/i,
  /Gemfile$/i,
  /go\.mod$/i,
  /alembic/i,
];

function isDbKeyFile(path: string): boolean {
  return DB_KEY_PATTERNS.some((p) => p.test(path));
}

export function buildDatabaseSystemPrompt(): string {
  return `You are a senior database engineer performing a schema and data access review.

Your goal: evaluate database design quality and data access patterns and return a precise JSON object.

Scoring guide:
- 85–100: Well-normalized schema; indexes on all FK and query fields; migrations managed; connection pooling configured; sensitive data encrypted
- 65–84: Good design with minor gaps — a few missing indexes or one un-encrypted sensitive field
- 45–64: Schema works but has normalization issues or several missing indexes; no migration management
- 25–44: Significant design problems — wide tables, no indexes, raw queries with interpolation
- 0–24: Critical issues — no schema management, data loss risk, security exposure

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT flag intentional denormalization without evidence it causes problems
- Focus only on what is visible in the source — do not assume production data volumes
- strengths: list 2–5 genuine positive database design characteristics, be specific
- Focus areas (check all that apply):
  1. Schema parsing: read Prisma schema, SQLAlchemy models, ActiveRecord models, or Go struct tags — identify the schema structure
  2. Normalization: obvious redundant data storage, missing junction tables for M2M relationships, large JSONB blobs used where typed columns would be clearer
  3. Index coverage: foreign key columns without @index; fields used in WHERE clauses (createdAt, userId, status) without indexes; unique constraints missing where business logic requires them
  4. Migration management: presence of a migration folder or tool (Prisma migrate, Alembic, Flyway); raw DDL in application code; schema changes without migrations
  5. Connection pooling: singleton DB client pattern (prevents connection exhaustion); PgBouncer or similar in infra config; connection limit set
  6. Sensitive data encryption: fields that store tokens, passwords, or PII — check if they are marked for encryption or if encryption is applied in the data layer
  7. N+1 access patterns: ORM calls inside loops, missing .include / eager loading in data access code`;
}

export function buildDatabaseUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze the database design of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  const keyFiles = files.filter((f) => isDbKeyFile(f.path)).slice(0, 20);

  // Include data-access code to check N+1 and query patterns
  const dataAccessFiles = files
    .filter(
      (f) =>
        !keyFiles.includes(f) &&
        /\/(lib|services?|repositories?|daos?)\//i.test(f.path) &&
        /\.(ts|js|py|go|rb)$/.test(f.path)
    )
    .slice(0, 15 - Math.min(keyFiles.length, 15));

  const displayFiles = [...keyFiles, ...dataAccessFiles];

  const fileContents = displayFiles
    .map((f) => {
      const content =
        f.content.length > CONTENT_CHAR_LIMIT
          ? f.content.slice(0, CONTENT_CHAR_LIMIT) + "\n... (truncated)"
          : f.content;
      return `### ${f.path}\n\`\`\`\n${content}\n\`\`\``;
    })
    .join("\n\n");

  const allPaths = files.map((f) => f.path).join("\n");

  const hasSchema = files.some((f) => /schema\.prisma$/i.test(f.path));
  const hasMigrations = files.some((f) => /migrations?\//i.test(f.path));

  return `Analyze the database design and data access patterns of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}
Prisma schema found: ${hasSchema}
Migration files found: ${hasMigrations}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
