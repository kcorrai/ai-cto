// v1 — 2026-06-13

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_500;

// Files most relevant for product management analysis
function productManagerScore(path: string): number {
  const lower = path.toLowerCase();
  if (lower.includes("onboard") || lower.includes("getting-started") || lower.includes("welcome"))
    return 100;
  if (
    lower.includes("sign-in") ||
    lower.includes("sign-up") ||
    lower.includes("login") ||
    lower.includes("register")
  )
    return 95;
  if (lower.includes("dashboard") || lower.includes("overview") || lower.includes("home"))
    return 90;
  if (lower.endsWith("page.tsx") || lower.endsWith("page.ts")) return 85;
  if (lower.endsWith("layout.tsx") || lower.endsWith("layout.ts")) return 80;
  if (lower.includes("/api/") || lower.includes("route.ts") || lower.includes("route.tsx"))
    return 75;
  if (lower.includes("nav") || lower.includes("sidebar") || lower.includes("menu")) return 70;
  if (lower.includes("modal") || lower.includes("dialog") || lower.includes("drawer")) return 65;
  if (lower.includes("form") || lower.includes("wizard") || lower.includes("step")) return 65;
  if (
    lower.includes("settings") ||
    lower.includes("profile") ||
    lower.includes("account") ||
    lower.includes("billing")
  )
    return 60;
  if (lower.includes("/features/") || lower.includes("/components/")) return 50;
  if (lower.includes("readme") || lower.endsWith(".md")) return 45;
  if (
    lower.includes("package.json") ||
    lower.includes("next.config") ||
    lower.includes("prisma/schema")
  )
    return 40;
  return 10;
}

export function buildProductManagerSystemPrompt(): string {
  return `You are a senior product manager reviewing a SaaS codebase to assess product completeness and identify product gaps.

Your goal: analyze the codebase from a product management perspective and return a precise JSON object.

What to assess:

Feature Completeness:
- Core user journeys: sign-up → onboarding → first value moment → ongoing use
- Are the flows fully implemented or partially built?
- Identify features that appear started but are not finished (incomplete forms, TODOs, placeholder UI)

Dark Features (built but inaccessible):
- Functionality implemented in code but not wired to any navigation or user path
- API endpoints or backend logic without corresponding UI
- Components defined but never rendered

User Flow Gaps:
- Missing flows that are expected for this product category (e.g., a SaaS tool with no settings page)
- Flows that exist in code but lack critical sub-steps (e.g., checkout without confirmation)
- No empty states, error states, or loading states for key interactions

Onboarding Analysis:
- Quality of the new user experience: is there a clear first-run path?
- Guided setup vs. blank slate: does the user know what to do first?
- Progressive disclosure: is complexity revealed gradually?

Product Category Fit:
- Based on the tech stack and feature set, identify the likely product category
- Identify table-stakes features for this category that are missing
- Note features that exceed category expectations (differentiators)

User Story Generation:
- For the top 3 most important missing or incomplete features, write a brief user story

Scoring guide:
- 85–100: Clear user journeys, complete onboarding, no incomplete features, all table-stakes present
- 65–84: Core flows complete with minor gaps (missing edge cases or one key feature)
- 45–64: Main flow works but notable gaps in onboarding, settings, or secondary flows
- 25–44: Multiple incomplete flows, missing key category features, poor user journey
- 0–24: Fundamental product flows missing, largely inaccessible features

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Only cite evidence you can see in the code — do not assume features exist elsewhere
- Be specific: name the exact page, component, or flow that is incomplete
- summary: 2–3 sentences on product completeness from a user perspective
- strengths: 2–5 specific positives that serve users well (e.g., "Clear onboarding wizard in /onboarding/page.tsx")`;
}

export function buildProductManagerUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Product management review of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  // Sort by product-manager relevance, take top 35
  const sorted = [...files]
    .sort((a, b) => productManagerScore(b.path) - productManagerScore(a.path))
    .slice(0, 35);

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

  return `Evaluate the product completeness and user experience of this codebase from a product management perspective.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## Page & Component File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
