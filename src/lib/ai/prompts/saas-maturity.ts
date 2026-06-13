// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

const SAAS_KEY_PATTERNS = [
  /stripe|billing|subscription|payment/i,
  /auth|session|clerk|next-auth/i,
  /webhook/i,
  /admin/i,
  /analytics|telemetry|posthog|segment|mixpanel/i,
  /rate.?limit/i,
  /audit/i,
  /feature.?flag/i,
  /email|resend|sendgrid/i,
  /feedback|support|intercom/i,
  /status.?page|uptime/i,
  /api.?key/i,
  /tenant|organization|team/i,
  /package\.json$/i,
];

function isSaasKeyFile(path: string): boolean {
  return SAAS_KEY_PATTERNS.some((p) => p.test(path));
}

export function buildSaasMaturitySystemPrompt(): string {
  return `You are an experienced SaaS founder and technical advisor reviewing a product's commercial readiness.

Your goal: evaluate how complete this project is as a commercial SaaS product and return a precise JSON object.

This is a checklist-driven assessment. For each missing element, assess the BUSINESS IMPACT — not just technical completeness. Frame findings as "what a paying customer would notice or need."

Scoring guide:
- 85–100: Production-ready SaaS — billing, auth, limits, admin tools, email, monitoring, multi-tenancy awareness
- 65–84: Core SaaS features present but missing 2–3 commercial requirements (e.g., no admin panel, no audit log)
- 45–64: Basic product that works but lacks several commercial necessities (no billing, no usage tracking)
- 25–44: Early-stage product missing most commercial SaaS infrastructure
- 0–24: Prototype or MVP with no commercial SaaS features beyond core functionality

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Use business-impact framing: "Users cannot self-serve their billing" not "No Stripe integration"
- Severity reflects business impact: critical = blocks revenue/retention, high = limits growth, medium = nice-to-have, low = polish
- strengths: list 2–5 genuine commercial SaaS strengths, be specific about what is implemented
- Checklist to assess (omit items clearly not applicable to the project type):
  1. Authentication and account management: login, signup, password reset, profile management
  2. Subscription and billing: payment integration (Stripe etc.), plan tiers, invoice access, self-serve upgrade/downgrade
  3. Plan limits and enforcement: usage limits enforced server-side; users notified when approaching limits
  4. Multi-tenancy: organization/team support, member invitations, role-based permissions within a team
  5. Admin tooling: internal admin panel or management interface for operators; user impersonation or lookup
  6. Usage tracking: analytics on feature usage; activation metrics; user behavior tracking
  7. API access for power users: public API or API keys for integrations
  8. Webhook support: event notifications for integrations and automation
  9. Email notification system: transactional emails for key events (welcome, billing, alerts)
  10. Customer feedback mechanism: in-app feedback form, support link, or chat widget
  11. Status page or incident communication: status page link or uptime monitoring
  12. Rate limiting: API rate limits to prevent abuse
  13. Audit logging: record of sensitive actions for compliance and debugging`;
}

export function buildSaasMaturityUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze the SaaS maturity of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, no findings.`;
  }

  const keyFiles = files.filter((f) => isSaasKeyFile(f.path)).slice(0, 30);

  // Include routing files to understand the product surface
  const routeFiles = files
    .filter(
      (f) =>
        !keyFiles.includes(f) &&
        /\/(api|routes?|pages?)\//i.test(f.path) &&
        /\.(ts|tsx|js|jsx)$/.test(f.path)
    )
    .slice(0, 10 - Math.min(keyFiles.length, 10));

  const displayFiles = [...keyFiles, ...routeFiles];

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

  const hasBilling = files.some((f) => /stripe|billing|subscription/i.test(f.path));
  const hasAuth = files.some((f) => /auth|clerk|session/i.test(f.path));
  const hasEmail = files.some((f) => /email|resend|sendgrid/i.test(f.path));
  const hasWebhook = files.some((f) => /webhook/i.test(f.path));

  return `Analyze the SaaS commercial maturity of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}
Billing integration found: ${hasBilling}
Auth integration found: ${hasAuth}
Email integration found: ${hasEmail}
Webhook support found: ${hasWebhook}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
