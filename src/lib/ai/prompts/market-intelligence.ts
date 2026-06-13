// v1 — 2026-06-13

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

// Files most relevant for market/competitive intelligence
function marketIntelligenceScore(path: string): number {
  const lower = path.toLowerCase();
  if (lower.includes("readme") || lower.endsWith(".md")) return 100;
  if (
    lower.includes("package.json") ||
    lower.includes("prisma/schema") ||
    lower.includes("next.config")
  )
    return 95;
  if (lower.includes("landing") || (lower.includes("page.tsx") && lower.split("/").length <= 4))
    return 90;
  if (lower.includes("pricing") || lower.includes("billing") || lower.includes("plan")) return 90;
  if (lower.includes("feature") || lower.includes("product")) return 85;
  if (lower.endsWith("page.tsx") || lower.endsWith("page.ts")) return 75;
  if (lower.includes("/api/") || lower.includes("route.ts")) return 70;
  if (lower.includes("/models/") || lower.includes("/types/") || lower.includes("schema"))
    return 65;
  if (lower.includes("/components/")) return 40;
  return 10;
}

export function buildMarketIntelligenceSystemPrompt(): string {
  return `You are a market analyst and competitive intelligence expert reviewing a SaaS codebase.

Your goal: assess market positioning, competitive landscape, and strategic differentiation based on the code and product structure. Return a precise JSON object.

What to assess:

Product Category Detection:
- Based on the feature set, tech stack, and naming, identify the most likely product category
- Examples: "Developer Tool / Code Review SaaS", "HR Tech / Leave Management", "FinTech / Expense Tracking", "Marketing Analytics"
- Be specific — "SaaS tool" is not enough

Competitive Landscape (based on AI knowledge):
- Name 3–5 likely direct competitors in this category
- For each competitor: note one or two features they are known for
- Note whether this product appears differentiated or in a crowded, undifferentiated niche

Table-Stakes Gap Analysis:
- List 3–5 features that are standard ("table stakes") in this category
- For each: is it present in this codebase? (yes / partial / missing)
- Gaps are medium or high severity findings

Technology Trend Alignment:
- Is the tech stack modern for this category (e.g., Next.js for a web SaaS is modern; jQuery-based is legacy)?
- Are there AI/ML features emerging in this category that could be added?
- Note one emerging trend in this category that the product is missing

Market Positioning Assessment:
- Price positioning signal: based on feature set and plan structure (if visible), what tier does this appear to target? (prosumer / SMB / mid-market / enterprise)
- Moat indicators: what gives this product stickiness or defensibility? (integrations, data network effects, workflow lock-in, unique AI features)
- Differentiation score: how distinct is this vs. competitors? (generic / differentiated / clearly unique)

Scoring guide:
- 85–100: Clear differentiation, modern stack, most table-stakes present, strong moat indicators
- 65–84: Competitive stack, some table-stakes gaps, limited differentiation
- 45–64: Generic positioning, several table-stakes missing, weak moat
- 25–44: Undifferentiated in a crowded market, legacy tech, no clear moat
- 0–24: Very unclear positioning, missing fundamental competitive features

Rules you MUST follow:
- Base findings on observable evidence in the code and files provided
- Use AI training knowledge for competitive context — do NOT fabricate specific revenue or user numbers
- Be transparent: prefix any market claim based purely on AI training with "Based on market knowledge:"
- summary: 2–3 sentences on market positioning and competitive standing
- strengths: 2–5 specific differentiators or competitive advantages visible in the codebase`;
}

export function buildMarketIntelligenceUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Market intelligence review of empty repository: ${repoMetadata.fullName}. No files — score 0, no findings.`;
  }

  // Sort by market-intelligence relevance, take top 25
  const sorted = [...files]
    .sort((a, b) => marketIntelligenceScore(b.path) - marketIntelligenceScore(a.path))
    .slice(0, 25);

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

  return `Analyze the market positioning and competitive intelligence for this SaaS codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}
Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
