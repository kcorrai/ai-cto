// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

const DEVOPS_KEY_PATTERNS = [
  /\.github\/workflows\//i,
  /\.gitlab-ci\.yml$/i,
  /\.circleci\//i,
  /Jenkinsfile$/i,
  /Makefile$/i,
  /Dockerfile$/i,
  /docker-compose\.(yml|yaml)$/i,
  /\.dockerignore$/i,
  /\.env\.example$/i,
  /vercel\.json$|vercel\.ts$/i,
  /netlify\.toml$/i,
  /heroku\.yml$/i,
  /railway\.toml$/i,
  /fly\.toml$/i,
  /kubernetes|k8s/i,
  /helm\//i,
  /terraform/i,
  /\.github\/dependabot/i,
  /renovate\.(json|ts)$/i,
];

function isDevOpsKeyFile(path: string): boolean {
  return DEVOPS_KEY_PATTERNS.some((p) => p.test(path));
}

export function buildDevOpsSystemPrompt(): string {
  return `You are a senior DevOps engineer performing a CI/CD and deployment maturity review.

Your goal: evaluate the DevOps practices, deployment pipeline, and operational readiness and return a precise JSON object.

Scoring guide:
- 85–100: Full CI/CD pipeline; automated tests on PR; staging + production environments; Docker; secrets managed; monitoring in place; rollback capability
- 65–84: CI/CD pipeline exists with some gaps; environments separated; Docker or equivalent; no monitoring
- 45–64: Basic CI (tests run) but no CD; manual deployments; no environment separation documented
- 25–44: Partial CI setup; no deployment automation; secrets in config files
- 0–24: No CI/CD; manual everything; secrets potentially exposed; no deployment documentation

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT flag managed platform conventions as issues (e.g., Vercel auto-deploys are valid CD)
- strengths: list 2–5 genuine positive DevOps characteristics, be specific
- Focus areas (check all that apply):
  1. CI pipeline: check for GitHub Actions, GitLab CI, CircleCI, Jenkins — does it run tests, lint, type check on every PR?
  2. CD pipeline: automated deployments to staging and production; platform integrations (Vercel, Railway, Fly.io, Heroku)
  3. Environment management: .env.example present; secrets not hardcoded; environment variable documentation
  4. Containerization: Dockerfile present and well-structured (multi-stage build, non-root user, .dockerignore); docker-compose for local dev
  5. Secrets management: secrets in .env.example but NOT hardcoded; no API keys or passwords in YAML/config files
  6. Monitoring and alerting: error tracking integration (Sentry, Datadog, etc.) referenced in code or config; health check endpoint
  7. Rollback capability: deployment platform supports rollback; no irreversible migration patterns without down migrations
  8. Dependency updates: Dependabot or Renovate configured for automated dependency PRs`;
}

export function buildDevOpsUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze the DevOps maturity of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  const keyFiles = files.filter((f) => isDevOpsKeyFile(f.path)).slice(0, 25);

  // Include package.json and app config for deployment hints
  const configFiles = files
    .filter(
      (f) =>
        !keyFiles.includes(f) &&
        /^(package\.json|next\.config|app\.config|tsconfig)/.test(f.path.split("/").pop() ?? "")
    )
    .slice(0, 5);

  const displayFiles = [...keyFiles, ...configFiles];

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

  const hasCI = files.some((f) =>
    /\.github\/workflows\/|\.gitlab-ci\.yml|\.circleci/i.test(f.path)
  );
  const hasDocker = files.some((f) => /Dockerfile|docker-compose/i.test(f.path));

  return `Analyze the DevOps maturity and deployment practices of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}
CI config found: ${hasCI}
Docker config found: ${hasDocker}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
