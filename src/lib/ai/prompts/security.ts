// v1 — 2026-06-12

import type { RepoBundle, RepoFile } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 3_000;

// Files most relevant for security review
function securityScore(path: string): number {
  const lower = path.toLowerCase();
  if (lower.includes("/api/") || lower.includes("/routes/") || lower.includes("/handlers/"))
    return 100;
  if (lower.includes("middleware") || lower.includes("proxy") || lower.includes("auth")) return 95;
  if (lower.includes("webhook")) return 90;
  if (lower.includes("/lib/") || lower.includes("client") || lower.includes("session")) return 80;
  if (lower.includes("env") || lower.includes("config")) return 70;
  if (lower.includes("prisma") || lower.includes("db") || lower.includes("database")) return 70;
  return 10;
}

export function buildSecuritySystemPrompt(): string {
  return `You are a security engineer performing a code security review.

Your goal: identify real security vulnerabilities and risks in this codebase, and return a precise JSON object.

Severity mapping — apply strictly:
- critical: confirmed vulnerability that exists in the code RIGHT NOW (e.g., hardcoded secret literal, SQL built by string concat with user input, missing auth check on a sensitive endpoint)
- high: pattern that is likely vulnerable under normal usage (e.g., auth check that can be bypassed with certain inputs, missing ownership check on a resource endpoint)
- medium: risk that requires specific conditions to exploit (e.g., missing rate limiting on a sensitive endpoint, broad error messages exposing stack traces)
- low / info: hygiene issues (e.g., overly permissive CORS, missing security header)

What to look for:
- Hardcoded secrets: API keys, passwords, tokens, webhook secrets as string literals in source code
- Missing authentication: API routes that mutate state or access sensitive data without verifying the session
- Missing authorization: Database queries that don't include an ownership check (e.g., no userId filter)
- SQL injection: raw string interpolation into queries (NOT applicable to Prisma parameterized queries)
- CSRF: GET routes that trigger state-changing side effects
- Insecure direct object reference: endpoints that accept an ID without verifying the caller owns it
- Environment variable exposure: secrets passed to the client bundle (NEXT_PUBLIC_ prefix with sensitive values)
- Input validation gaps: API routes that use request body/params without Zod or equivalent validation
- Insecure dependencies: packages with known critical CVEs mentioned in manifests

Do NOT flag as vulnerabilities:
- Prisma ORM queries (.findUnique, .create, .update, etc.) — Prisma uses parameterized queries, immune to SQL injection
- Encrypted storage of tokens when AES-256-GCM or equivalent is used
- Clerk session validation when clerkMiddleware or auth() is visibly used
- Svix/HMAC webhook signature verification patterns

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths
- Do NOT false-positive on safe patterns (Prisma, Clerk, Svix) — these are intentional safeguards
- summary: 2–3 sentences on the overall security posture
- strengths: 2–5 genuine security positives (e.g., "All webhook handlers verify signatures before processing")

Scoring guide:
- 85–100: Minimal attack surface, consistent auth/authz, no secrets in code, input validated everywhere
- 65–84: Good posture with minor gaps (e.g., one endpoint missing rate limiting)
- 45–64: Moderate concerns — some auth/authz gaps or missing input validation
- 25–44: Significant issues — multiple missing auth checks or exposed sensitive data patterns
- 0–24: Critical vulnerabilities present — confirmed exploitable issues`;
}

export function buildSecurityUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Security review of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  // Prioritize security-sensitive files
  const sorted: RepoFile[] = [...files]
    .sort((a, b) => securityScore(b.path) - securityScore(a.path))
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

  return `Perform a security review of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## Security-Sensitive File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
