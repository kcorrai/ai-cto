// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";

const CONTENT_CHAR_LIMIT = 2_500;

// Files most relevant for product readiness (UI, pages, layouts, auth)
function productReadinessScore(path: string): number {
  const lower = path.toLowerCase();
  if (
    lower.includes("sign-in") ||
    lower.includes("sign-up") ||
    lower.includes("login") ||
    lower.includes("register")
  )
    return 100;
  if (lower.includes("onboard") || lower.includes("welcome") || lower.includes("getting-started"))
    return 95;
  if (lower.includes("error") || lower.includes("not-found") || lower.includes("404")) return 90;
  if (lower.endsWith("layout.tsx") || lower.endsWith("layout.ts")) return 85;
  if (lower.includes("landing") || (lower.includes("page.tsx") && lower.split("/").length <= 4))
    return 85;
  if (lower.includes("privacy") || lower.includes("terms") || lower.includes("legal")) return 85;
  if (lower.includes("dashboard") || lower.includes("home")) return 80;
  if (lower.includes("support") || lower.includes("help") || lower.includes("contact")) return 80;
  if (
    lower.includes("analytic") ||
    lower.includes("telemetry") ||
    lower.includes("posthog") ||
    lower.includes("segment") ||
    lower.includes("mixpanel")
  )
    return 75;
  if (lower.includes("seo") || lower.includes("metadata") || lower.includes("og-image")) return 70;
  if (lower.endsWith("page.tsx") || lower.endsWith("page.ts")) return 65;
  if (lower.includes("/components/")) return 40;
  return 10;
}

export function buildProductReadinessSystemPrompt(): string {
  return `You are a product engineer evaluating whether a SaaS product is ready to put in front of real users.

Your goal: assess product completeness from a user-facing perspective and return a precise JSON object.

What to look for:

Authentication & Onboarding:
- Sign-in and sign-up flows exist and appear functional
- New user onboarding path (welcome screen, setup wizard, or guided first-run)
- Empty states for new users (dashboards or lists that explain what to do)

Error & Loading UX:
- Error boundaries or error pages (404, 500) that communicate clearly
- Loading states for async operations (spinners, skeletons, disabled buttons)
- Form validation errors communicated to the user

Legal & Trust:
- Privacy policy page or link
- Terms of service page or link
- Cookie consent if applicable

Discoverability & SEO:
- \`<title>\` tags and meta descriptions on key pages
- Open Graph tags for social sharing
- Robots.txt or sitemap signals

Support & Contact:
- Support email, chat widget, or help center link
- Contact page or at least a contact mechanism

Analytics:
- Any analytics or telemetry integration (PostHog, Mixpanel, Segment, Google Analytics, Plausible, etc.)

Scoring guide:
- 85–100: Auth flow complete, onboarding present, error/loading states handled, legal pages exist, analytics wired up
- 65–84: Core flows complete with minor gaps (e.g., missing analytics or one legal page)
- 45–64: Functional but rough — missing loading states, error handling, or onboarding
- 25–44: Multiple significant gaps in user-facing completeness
- 0–24: Missing fundamental user-facing features (no auth UI, no error handling, no structure)

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Evaluate based on evidence in the code — do NOT assume features exist if you cannot see them
- Give benefit of the doubt for features that appear to be implemented elsewhere (e.g., Clerk handles auth UI)
- summary: 2–3 sentences on product readiness from a user perspective
- strengths: 2–5 specific positives (e.g., "Sign-in and sign-up pages implemented via Clerk")`;
}

export function buildProductReadinessUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Product readiness review of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  // Sort by product-readiness relevance, take top 30
  const sorted = [...files]
    .sort((a, b) => productReadinessScore(b.path) - productReadinessScore(a.path))
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

  return `Evaluate the product readiness of this codebase from a user-facing perspective.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## UI & Page File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
