// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

// Files most relevant for performance assessment
const PERF_PRIORITY_PATTERNS = [
  /package\.json$/i,
  /next\.config\.(ts|js|mjs)$/i,
  /\/(api|routes?)\//i,
  /\/(lib|services?|repositories?)\//i,
  /schema\.prisma$/i,
  /\.(tsx|jsx)$/i,
  /tailwind\.config\.(ts|js|mjs)$/i,
];

function isPerfKeyFile(path: string): boolean {
  return PERF_PRIORITY_PATTERNS.some((p) => p.test(path));
}

export function buildPerformanceSystemPrompt(): string {
  return `You are a senior performance engineer performing a code performance review.

Your goal: identify concrete performance problems in the codebase and return a precise JSON object.

Scoring guide:
- 85–100: No significant performance issues; caching in place, queries optimized, React rendering efficient
- 65–84: Minor issues that are low-risk but worth fixing
- 45–64: Moderate issues that will cause user-visible slowness at scale
- 25–44: Serious bottlenecks — N+1 queries, blocking I/O, no caching on hot paths
- 0–24: Critical performance problems that will fail under any real load

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT give generic advice without a specific location in the code
- If a concern does not apply to this codebase, omit it — do not force findings
- strengths: list 2–5 genuine positive performance characteristics, be specific
- Focus areas (check all that apply):
  1. N+1 query patterns: ORM calls inside loops, missing .include / eager-loading
  2. Missing query optimization: SELECT * (no field selection), missing pagination on list queries
  3. Caching: repeated expensive DB/API calls with no cache layer, missing HTTP cache headers
  4. React rendering: missing useMemo/useCallback on expensive computations passed as props, missing React.memo on pure components that receive object props
  5. Image optimization: raw <img> tags instead of next/image, missing width/height, no format optimization
  6. Synchronous blocking: synchronous file I/O, CPU-bound loops, JSON.parse on large payloads in request handlers
  7. Bundle size: missing dynamic imports for heavy libraries, missing code splitting on route level`;
}

export function buildPerformanceUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze performance of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  // Key files for performance analysis
  const keyFiles = files.filter((f) => isPerfKeyFile(f.path)).slice(0, 20);

  // Fill remaining with any .ts/.tsx files not already included
  const remaining = files
    .filter((f) => !keyFiles.includes(f) && /\.(ts|tsx|js|jsx)$/.test(f.path))
    .slice(0, 25 - keyFiles.length);

  const displayFiles = [...keyFiles, ...remaining];

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

  return `Analyze the performance characteristics of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
