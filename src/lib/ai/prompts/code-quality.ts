// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";

const CONTENT_CHAR_LIMIT = 3_000;

// Skip config/asset files — focus on executable source code
const SKIP_PATTERNS = [
  /\.(json|yaml|yml|toml|md|mdx|css|scss|svg|png|ico)$/i,
  /^(package|tsconfig|eslint|prettier|next\.config|tailwind|postcss)/i,
  /schema\.prisma$/i,
];

const SOURCE_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".rb",
  ".java",
  ".kt",
  ".swift",
  ".cs",
  ".php",
]);

function isSourceFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return SOURCE_EXTS.has(ext) && !SKIP_PATTERNS.some((p) => p.test(path.split("/").pop() ?? ""));
}

export function buildCodeQualitySystemPrompt(): string {
  return `You are a senior software engineer performing a code quality review.

Your goal: evaluate code maintainability, readability, and correctness, and return a precise JSON object.

Scoring guide:
- 85–100: Consistent, readable, well-typed, DRY, proper error handling, testable design
- 65–84: Good quality with minor issues (occasional duplication or code smell)
- 45–64: Moderate quality — noticeable duplication, inconsistent patterns, gaps in error handling
- 25–44: Low quality — widespread smells, poor naming, missing error handling
- 0–24: Critical issues — bugs, deeply unmaintainable code, pervasive anti-patterns

What to look for:
- DRY violations: copy-pasted logic that should be a shared utility
- Function size: functions doing more than one thing (> ~40 lines is a signal)
- Naming: variables/functions that don't reveal intent (e.g., x, data, temp, handleThing)
- Error handling: async operations without try/catch or .catch(), swallowed errors
- Code smells: deep nesting (> 3 levels), god objects, long parameter lists (> 4 params)
- TypeScript: explicit \`any\`, missing return types on public functions, implicit \`any\` via inference
- Logic issues: unreachable code, conditions that are always true/false, missing edge cases

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT give generic advice without a specific location in the code
- summary: write 2–3 sentences describing the overall code quality level and main themes
- strengths: list 2–5 genuine positive patterns, be specific (e.g., "Consistent async/await error handling in all route handlers")`;
}

export function buildCodeQualityUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze code quality of an empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  // Select source code files for quality review, excluding config/assets
  const sourceFiles = files.filter((f) => isSourceFile(f.path));
  const displayFiles = sourceFiles.slice(0, 30);

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

  return `Review the code quality of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount} (${sourceFiles.length} source files shown below)

## Source File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
