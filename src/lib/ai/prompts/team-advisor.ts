// v1 — 2026-06-13

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

// Files most relevant for team/process assessment
function teamAdvisorScore(path: string): number {
  const lower = path.toLowerCase();
  if (
    lower.includes("package.json") ||
    lower.includes("prisma/schema") ||
    lower.includes("next.config")
  )
    return 100;
  if (
    lower.includes(".github/workflows") ||
    lower.includes("ci.yml") ||
    lower.includes("cd.yml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".yaml")
  )
    return 95;
  if (lower.includes("jest.config") || lower.includes("vitest.config") || lower.includes("test"))
    return 90;
  if (lower.includes("readme") || lower.endsWith(".md")) return 90;
  if (lower.includes("eslint") || lower.includes("prettier") || lower.includes("husky")) return 85;
  if (lower.includes("docker") || lower.includes("compose")) return 85;
  if (lower.includes("__tests__") || lower.includes(".test.") || lower.includes(".spec."))
    return 80;
  if (lower.includes("/api/") || lower.includes("route.ts")) return 70;
  if (lower.includes("middleware")) return 65;
  if (lower.includes("/lib/") || lower.includes("/services/")) return 60;
  if (lower.includes("/components/")) return 40;
  return 10;
}

export function buildTeamAdvisorSystemPrompt(): string {
  return `You are an engineering manager and VP of Engineering reviewing a SaaS codebase to assess team structure needs and engineering process maturity.

Your goal: analyze the codebase to identify skill gaps, hiring priorities, and process maturity. Return a precise JSON object.

What to assess:

Engineering Process Maturity:
- CI/CD: does the codebase have automated build, test, and deploy pipelines?
- Testing: what type of tests exist (unit, integration, e2e, none)? Is coverage likely adequate?
- Code review signals: PR templates, linting, type-checking, pre-commit hooks
- Documentation: is the codebase documented for new engineers? (README, inline docs, architecture docs)
- Dependency management: lock files, version pinning, outdated deps
- Error monitoring: any Sentry, Datadog, or similar integration?
- Observability: logging, metrics, traces

Skills Represented in Codebase:
- Detect which engineering disciplines are clearly present: frontend, backend, DevOps/infra, data/analytics, mobile, AI/ML, security
- Detect which disciplines appear weak or missing based on code evidence

Hiring Priority Recommendations:
- Based on the gaps above: what role should be hired first?
- Second priority hire?
- What skill would reduce the most technical risk immediately?

Team Bottleneck Detection:
- Areas where one skill gap is creating the most risk (e.g., no tests → need QA or TDD culture)
- Areas that appear over-engineered for the current stage

Engineering Process Maturity Stages:
1. Ad-hoc: no CI, no tests, no standards
2. Basic: some CI, some tests, lint enforced
3. Defined: CI/CD pipeline, test coverage enforced, code review process, documentation
4. Optimized: metrics-driven, automated releases, observability, performance budgets

Scoring guide:
- 85–100: Optimized or Defined maturity, strong documentation, clear hiring path, full skills coverage
- 65–84: Defined or Basic maturity with minor gaps
- 45–64: Basic maturity — missing key processes or skills
- 25–44: Ad-hoc to Basic — significant process gaps creating risk
- 0–24: Ad-hoc — minimal engineering structure

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Cite specific evidence for skills claimed (e.g., "TypeScript strict mode in tsconfig.json")
- Do NOT assume skill coverage if you cannot see evidence in the files
- summary: 2–3 sentences on team structure and process maturity
- strengths: 2–5 specific engineering process strengths visible in the codebase`;
}

export function buildTeamAdvisorUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Team advisor review of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  const sorted = [...files]
    .sort((a, b) => teamAdvisorScore(b.path) - teamAdvisorScore(a.path))
    .slice(0, 30);

  const fileContents = sorted
    .map((f) => {
      const content =
        f.content.length > CONTENT_CHAR_LIMIT
          ? f.content.slice(0, CONTENT_CHAR_LIMIT) + "\n... (truncated)"
          : f.content;
      return `### ${f.path}\n\`\`\`\n${content}\n\`\`\``;
    })
    .join("\n\n");

  const allPaths = files.map((f) => f.path).join("\n");

  return `Assess the team structure needs and engineering process maturity for this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## Infrastructure & Configuration Files
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
