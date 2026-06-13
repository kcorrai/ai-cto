// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

// Manifest files to include at full content
const MANIFEST_PATTERNS = [
  /^package\.json$/i,
  /^requirements\.txt$/i,
  /^gemfile$/i,
  /^go\.mod$/i,
  /^cargo\.toml$/i,
  /^pyproject\.toml$/i,
  /^setup\.py$/i,
  /^setup\.cfg$/i,
  /^composer\.json$/i,
  /^pom\.xml$/i,
  /^build\.gradle(\.kts)?$/i,
  /^mix\.exs$/i,
];

const LOCK_FILE_PATTERNS = [
  /^package-lock\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /^yarn\.lock$/i,
  /^gemfile\.lock$/i,
  /^poetry\.lock$/i,
  /^cargo\.lock$/i,
  /^go\.sum$/i,
];

function isManifest(path: string): boolean {
  const filename = path.split("/").pop() ?? "";
  return MANIFEST_PATTERNS.some((p) => p.test(filename));
}

function isLockFile(path: string): boolean {
  const filename = path.split("/").pop() ?? "";
  return LOCK_FILE_PATTERNS.some((p) => p.test(filename));
}

export function buildDependenciesSystemPrompt(): string {
  return `You are a senior engineer performing a dependency health review.

Your goal: evaluate the health, currency, and management of dependencies in this codebase.

What to assess:
- Outdated major versions: packages pinned to a significantly old major version (e.g., React 16 when 19 is current, Next.js 12 when 16 is current). Use your training knowledge of version history.
- Known vulnerability patterns: packages with well-known CVEs in specific version ranges (e.g., lodash < 4.17.21, log4j 2.x < 2.17)
- Dev dependencies in production: packages that are clearly build/test tools appearing in dependencies instead of devDependencies
- Lock file hygiene: lock file present and consistent with the manifest
- Dependency bloat: excessive number of dependencies for the project type, or obvious duplicates
- Deprecated packages: packages that are officially deprecated with known alternatives
- License issues: packages with licenses incompatible with commercial SaaS (GPL in production, etc.)
- Monorepo: if multiple manifests are present, evaluate each workspace

Scoring guide:
- 85–100: All dependencies reasonably current, no known vulnerabilities, lock file present, proper dev/prod separation
- 65–84: Minor version drift or 1–2 low-severity issues
- 45–64: Moderate drift — some outdated majors or missing lock file
- 25–44: Multiple outdated major versions or known vulnerability patterns
- 0–24: Critical known vulnerabilities or severely outdated dependencies

Rules you MUST follow:
- Every finding's filePath MUST be the exact manifest file path from the "Available file paths" list
- Only flag outdated versions when you have high confidence the version is substantially behind current
- Do NOT flag minor/patch updates as issues — only major version gaps matter
- summary: 2–3 sentences on overall dependency health
- strengths: 2–5 genuine positives (e.g., "Lock file present and committed", "Dev dependencies correctly separated")`;
}

export function buildDependenciesUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo } = bundle;

  if (files.length === 0) {
    return `Dependency review of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  const manifests = files.filter((f) => isManifest(f.path));
  const lockFiles = files.filter((f) => isLockFile(f.path));

  if (manifests.length === 0) {
    return `Dependency review of ${repoMetadata.fullName}.

No dependency manifest files found in the analyzed files. This may indicate an unusual project structure or that manifest files exceeded the size limit.

Available file paths:
${files.map((f) => f.path).join("\n")}

Score conservatively (around 50) and note the absence of detectable manifests as a finding.`;
  }

  const manifestContents = manifests
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const lockFileList =
    lockFiles.length > 0
      ? lockFiles.map((f) => `- ${f.path} (${(f.size / 1024).toFixed(1)} KB)`).join("\n")
      : "None found";

  const allPaths = files.map((f) => f.path).join("\n");

  return `Review the dependency health of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}

## Dependency Manifests
${manifestContents}

## Lock Files Present
${lockFileList}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
