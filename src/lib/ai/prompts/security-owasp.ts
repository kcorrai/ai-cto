// v1 — 2026-06-13

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 3_000;

// OWASP-specific file prioritization — all security-relevant files first
function owaspScore(path: string): number {
  const lower = path.toLowerCase();
  if (lower.includes("middleware") || lower.includes("auth")) return 100;
  if (lower.includes("/api/") || lower.includes("route.ts") || lower.includes("route.tsx"))
    return 98;
  if (lower.includes("crypto") || lower.includes("encrypt") || lower.includes("hash")) return 97;
  if (lower.includes("session") || lower.includes("token") || lower.includes("jwt")) return 96;
  if (lower.includes("prisma/schema") || lower.includes("database")) return 95;
  if (lower.includes("env") || lower.includes("config")) return 90;
  if (lower.includes("webhook") || lower.includes("callback")) return 88;
  if (lower.includes("upload") || lower.includes("file")) return 85;
  if (lower.includes("form") || lower.includes("input") || lower.includes("validation")) return 80;
  if (lower.includes("log") || lower.includes("monitor") || lower.includes("sentry")) return 75;
  if (lower.includes("/lib/") || lower.includes("/services/")) return 60;
  if (lower.includes("/components/")) return 30;
  return 10;
}

const OWASP_CATEGORIES = [
  "A01:2021 – Broken Access Control",
  "A02:2021 – Cryptographic Failures",
  "A03:2021 – Injection",
  "A04:2021 – Insecure Design",
  "A05:2021 – Security Misconfiguration",
  "A06:2021 – Vulnerable and Outdated Components",
  "A07:2021 – Identification and Authentication Failures",
  "A08:2021 – Software and Data Integrity Failures",
  "A09:2021 – Security Logging and Monitoring Failures",
  "A10:2021 – Server-Side Request Forgery (SSRF)",
] as const;

export { OWASP_CATEGORIES };

export function buildSecurityOwaspSystemPrompt(): string {
  return `You are a senior application security engineer conducting an OWASP Top 10 (2021) security audit of a SaaS codebase.

Your goal: systematically check for each OWASP Top 10 category and return a precise, evidence-based JSON object.

For EACH of the 10 OWASP categories, you must evaluate the codebase:

A01:2021 – Broken Access Control
- Missing authorization checks before resource access
- Insecure Direct Object Reference (IDOR): user IDs in URLs without ownership verification
- Missing role checks on admin or privileged routes
- CORS misconfiguration allowing broad origins

A02:2021 – Cryptographic Failures
- Sensitive data stored unencrypted (passwords, tokens, PII in plaintext)
- Weak hashing algorithms (MD5, SHA1 for passwords)
- HTTP used where HTTPS is required
- Hardcoded encryption keys or secrets in source code

A03:2021 – Injection
- SQL injection: string interpolation in queries instead of parameterized queries
- NoSQL injection
- Command injection: user input passed to shell commands
- Template injection

A04:2021 – Insecure Design
- Missing rate limiting on authentication endpoints
- No account lockout mechanism
- Business logic flaws (price manipulation, quantity bypasses)
- Missing multi-tenancy isolation

A05:2021 – Security Misconfiguration
- Default credentials or debug modes left on
- Unnecessary features enabled (exposed admin UIs, debug endpoints)
- Stack traces or verbose errors exposed to users
- Missing security headers (CSP, HSTS, X-Frame-Options)

A06:2021 – Vulnerable and Outdated Components
- Known vulnerable package versions in dependencies
- Unmaintained or abandoned libraries

A07:2021 – Identification and Authentication Failures
- Weak password policies
- Missing MFA support
- Insecure session management (long-lived sessions, no rotation)
- Predictable session tokens

A08:2021 – Software and Data Integrity Failures
- Missing integrity checks on downloaded artifacts
- Insecure deserialization
- No subresource integrity (SRI) for CDN assets

A09:2021 – Security Logging and Monitoring Failures
- No logging of authentication events (login, logout, failures)
- No logging of access control failures
- Sensitive data included in logs
- No alerting on suspicious activity

A10:2021 – Server-Side Request Forgery (SSRF)
- User-controlled URLs fetched by the server without validation
- Missing URL allowlisting for outbound requests
- Internal metadata endpoints accessible via SSRF

Scoring guide:
- 85–100: No critical/high findings, all 10 categories have defensive measures visible
- 65–84: 1–2 high findings, most categories addressed
- 45–64: Multiple high findings or one critical, several gaps
- 25–44: Critical finding(s) or many high-severity gaps
- 0–24: Multiple critical findings, fundamental security gaps

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- For each finding: include which OWASP category it falls under in the description
- "critical": confirmed exploitable vulnerability visible in code right now
- "high": likely vulnerable under normal usage, requires attention before production
- Do NOT false-positive Prisma parameterized queries as SQL injection
- Do NOT flag third-party auth providers (Clerk, Auth0) for auth issues they handle correctly
- summary: 2–3 sentences on overall security posture
- strengths: 2–5 specific security positives (e.g., "Webhook signatures verified with timing-safe comparison")`;
}

export function buildSecurityOwaspUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `OWASP security audit of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  const sorted = [...files].sort((a, b) => owaspScore(b.path) - owaspScore(a.path)).slice(0, 35);

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

  return `Conduct an OWASP Top 10 (2021) security audit for this codebase. Check all 10 categories systematically.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## Security-Relevant File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
