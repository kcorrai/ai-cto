// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 3_000;

const DOCS_KEY_PATTERNS = [
  /^README(\..+)?$/i,
  /^CONTRIBUTING(\..+)?$/i,
  /^CHANGELOG(\..+)?$/i,
  /^LICENSE(\..+)?$/i,
  /^SECURITY(\..+)?$/i,
  /\/docs?\//i,
  /swagger|openapi/i,
  /\.mdx?$/i,
  /package\.json$/i,
];

function isDocsKeyFile(path: string): boolean {
  return DOCS_KEY_PATTERNS.some((p) => p.test(path));
}

export function buildDocumentationSystemPrompt(): string {
  return `You are a senior technical writer performing a documentation quality review.

Your goal: evaluate documentation completeness and quality, and return a precise JSON object.

Scoring guide:
- 85–100: Comprehensive docs — excellent README, API docs, architecture guide, CONTRIBUTING, CHANGELOG
- 65–84: Good README with some gaps; missing one or two standard docs
- 45–64: Basic README that covers setup but lacks depth; no API or architecture docs
- 25–44: Thin README or one that is mostly boilerplate; no developer-facing docs
- 0–24: No meaningful documentation; missing or placeholder README

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Keep findings concise — documentation issues rarely warrant "critical" severity; use "medium" or "low" unless a complete absence of docs blocks contributors
- strengths: list 2–5 genuine positive documentation characteristics, be specific
- Focus areas (check all that apply):
  1. README quality: does it explain what the project does, how to set it up, and how to run it? Flag if it is a template/boilerplate with unfilled placeholders
  2. API documentation: for projects with HTTP routes or public APIs, check for OpenAPI/Swagger spec, JSDoc, or inline route comments
  3. Architecture documentation: any description of system design, data flow, or module relationships
  4. CONTRIBUTING guide: contribution process, branch naming, PR conventions, code style notes
  5. CHANGELOG: version history or release notes to track what changed and when
  6. Inline code documentation: JSDoc/docstrings on exported functions and complex logic — flag only if consistently absent on public API surface
  7. User-facing help: for SaaS products, check for help docs, onboarding guides, or in-app tooltips referenced in code`;
}

export function buildDocumentationUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze the documentation of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  const keyFiles = files.filter((f) => isDocsKeyFile(f.path)).slice(0, 20);

  // Include a few source files to assess inline doc quality
  const sourceFiles = files
    .filter(
      (f) =>
        !keyFiles.includes(f) &&
        /\.(ts|tsx|js|jsx|py|go|rb)$/.test(f.path) &&
        !f.path.includes("node_modules")
    )
    .slice(0, 10 - Math.min(keyFiles.length, 10));

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

  const hasReadme = files.some((f) => /^README(\..+)?$/i.test(f.path));
  const hasContributing = files.some((f) => /^CONTRIBUTING(\..+)?$/i.test(f.path));
  const hasChangelog = files.some((f) => /^CHANGELOG(\..+)?$/i.test(f.path));

  return `Analyze the documentation completeness and quality of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}
README found: ${hasReadme}
CONTRIBUTING found: ${hasContributing}
CHANGELOG found: ${hasChangelog}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
