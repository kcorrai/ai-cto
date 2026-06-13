// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

const API_KEY_PATTERNS = [
  /\/(api|routes?|controllers?|handlers?)\//i,
  /route\.(ts|js)$/i,
  /controller\.(ts|js)$/i,
  /handler\.(ts|js)$/i,
  /swagger|openapi/i,
  /middleware\.(ts|js)$/i,
  /app\.(ts|js)$/i,
  /server\.(ts|js)$/i,
  /next\.config\.(ts|js|mjs)$/i,
];

function isApiKeyFile(path: string): boolean {
  return API_KEY_PATTERNS.some((p) => p.test(path));
}

export function buildApiDesignSystemPrompt(): string {
  return `You are a senior API architect performing an API design review.

Your goal: evaluate the quality, consistency, and correctness of the API surface and return a precise JSON object.

Scoring guide:
- 85–100: Clean, consistent REST semantics; validation on all inputs; proper error shapes; pagination; rate limiting
- 65–84: Mostly consistent with minor semantic issues; validation present but incomplete
- 45–64: Naming inconsistencies or method misuse; several endpoints missing validation; no versioning strategy
- 25–44: Significant inconsistencies; state-changing GETs; raw errors exposed; no input sanitization
- 0–24: No discernible API design conventions; dangerous patterns throughout

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT flag framework conventions as issues (e.g., Next.js App Router file-based routing is intentional)
- Focus on what is detectable from source code alone — do not assume runtime behavior
- strengths: list 2–5 genuine positive API design characteristics, be specific
- Focus areas (check all that apply):
  1. Naming consistency: kebab-case vs camelCase vs snake_case in route paths; plural vs singular resource names
  2. HTTP method semantics: GET routes that mutate state; missing PUT/PATCH distinction; DELETE routes returning 200 instead of 204
  3. Error response format: check if error shapes are consistent (same fields across handlers); raw exceptions returned to client
  4. Input validation: routes that use request.body or params without schema validation (Zod, Joi, Yup, etc.)
  5. Pagination: list endpoints that return unbounded result sets without limit/offset or cursor
  6. API versioning: check for /v1/ prefix, Accept-Version header, or any versioning strategy for externally consumed APIs
  7. Rate limiting: check for rate-limit middleware or headers on sensitive routes (auth, payment, user creation)
  8. CORS: check for CORS configuration — overly permissive wildcard origins on non-public APIs`;
}

export function buildApiDesignUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze the API design of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  const keyFiles = files.filter((f) => isApiKeyFile(f.path)).slice(0, 30);

  // Also include schema/validation files
  const validationFiles = files
    .filter(
      (f) => !keyFiles.includes(f) && /(schema|validation|validator|dto)\.(ts|js)$/i.test(f.path)
    )
    .slice(0, 5);

  const displayFiles = [...keyFiles, ...validationFiles];

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

  const routeFiles = files.filter((f) => isApiKeyFile(f.path));

  return `Analyze the API design quality and consistency of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}
API/route files found in sample: ${routeFiles.length}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
