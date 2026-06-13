// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

const TESTING_KEY_PATTERNS = [
  /\.(test|spec)\.(ts|tsx|js|jsx|py|rb|go|rs)$/i,
  /jest\.config\.(ts|js|mjs|cjs)$/i,
  /vitest\.config\.(ts|js|mjs)$/i,
  /pytest\.ini$/i,
  /setup\.(ts|js|jest)\.(ts|js)$/i,
  /\.github\/workflows\//i,
  /\.gitlab-ci\.yml$/i,
  /package\.json$/i,
  /Makefile$/i,
  /\/e2e\//i,
  /\/cypress\//i,
  /\/playwright\//i,
  /\/tests?\//i,
  /\/__tests__\//i,
];

function isTestingKeyFile(path: string): boolean {
  return TESTING_KEY_PATTERNS.some((p) => p.test(path));
}

export function buildTestingSystemPrompt(): string {
  return `You are a senior software engineer performing a testing strategy review.

Your goal: evaluate the depth and quality of the test suite and return a precise JSON object.

Scoring guide:
- 85–100: Comprehensive tests — unit, integration, and E2E; CI enforces them; critical paths covered
- 65–84: Decent coverage with some gaps; CI present but not all paths tested
- 45–64: Tests exist but are shallow or only cover happy paths; CI may be missing
- 25–44: Few tests, mostly smoke tests or trivial assertions; critical logic untested
- 0–24: No meaningful tests, or tests that only import files without asserting anything

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT give generic advice without reference to the actual codebase structure
- If a concern does not apply to this codebase, omit it — do not force findings
- strengths: list 2–5 genuine positive testing characteristics, be specific
- Focus areas (check all that apply):
  1. Test presence: ratio of test files to source files; flag if there are no test files at all
  2. Framework detection: identify the test runner (Jest, Vitest, pytest, Go testing, etc.) from config and package files
  3. CI enforcement: check .github/workflows/, .gitlab-ci.yml, Makefile for test execution steps
  4. Critical path coverage: look for test files corresponding to auth, payments, core business logic directories; flag missing counterparts
  5. Test quality: assertions that are trivial (toBeTruthy, not.toBeNull on fixed values), tests with no expect() calls, test files with no test cases
  6. Test type coverage: distinguish unit (isolated, mocked), integration (multi-module, DB), and E2E (browser/playwright/cypress); flag if an entire tier is absent
  7. Test configuration: look for coverage thresholds in jest/vitest config; flag if no threshold is set`;
}

export function buildTestingUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze the testing strategy of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  // Prioritize test and CI files
  const keyFiles = files.filter((f) => isTestingKeyFile(f.path)).slice(0, 25);

  // Include some source files to check for corresponding test coverage
  const sourceFiles = files
    .filter(
      (f) =>
        !keyFiles.includes(f) &&
        /\.(ts|tsx|js|jsx|py|go|rb|rs)$/.test(f.path) &&
        !f.path.includes("node_modules")
    )
    .slice(0, 15 - Math.min(keyFiles.length, 15));

  const displayFiles = [...keyFiles, ...sourceFiles];

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

  // Summarize test file counts for the model
  const testFilePaths = files.filter((f) =>
    /\.(test|spec)\.(ts|tsx|js|jsx|py|rb|go|rs)$/i.test(f.path)
  );
  const ciFiles = files.filter((f) =>
    /\.github\/workflows\/|\.gitlab-ci\.yml|Makefile/i.test(f.path)
  );

  return `Analyze the testing strategy and coverage of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}
Test files found in sample: ${testFilePaths.length}
CI config files found in sample: ${ciFiles.length}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
