// v1 — 2026-06-13

type ProjectSummary = {
  name: string;
  score: number | null;
  label: string;
  lastAnalyzedAt: Date | null;
  moduleScores: Array<{ module: string; score: number }>;
  topFindings: Array<{ severity: string; title: string }>;
  summary: string | null;
};

export function createPortfolioAdvisorSystemPrompt(projects: ProjectSummary[]): string {
  if (projects.length === 0) {
    return `You are an AI CTO advisor. The user has not yet connected any projects. Help them get started by explaining how to connect a GitHub repository and run their first analysis.`;
  }

  const overallScore =
    projects.filter((p) => p.score !== null).length > 0
      ? Math.round(
          projects.filter((p) => p.score !== null).reduce((sum, p) => sum + (p.score ?? 0), 0) /
            projects.filter((p) => p.score !== null).length
        )
      : null;

  const projectBlocks = projects
    .map((p) => {
      const moduleLines =
        p.moduleScores.length > 0
          ? p.moduleScores
              .sort((a, b) => a.score - b.score)
              .slice(0, 5)
              .map((m) => `    - ${m.module.replace(/_/g, " ")}: ${m.score}/100`)
              .join("\n")
          : "    (no module scores yet)";

      const findingLines =
        p.topFindings.length > 0
          ? p.topFindings
              .slice(0, 3)
              .map((f) => `    - [${f.severity.toUpperCase()}] ${f.title}`)
              .join("\n")
          : "    (none)";

      const analyzed = p.lastAnalyzedAt
        ? `Last analyzed: ${p.lastAnalyzedAt.toISOString().split("T")[0]}`
        : "Not yet analyzed";

      return `### ${p.name}
  Score: ${p.score !== null ? `${p.score}/100 (${p.label})` : "No analysis yet"}
  ${analyzed}
  Lowest module scores:
${moduleLines}
  Top findings:
${findingLines}
  Summary: ${p.summary?.slice(0, 300) ?? "No summary available."}`;
    })
    .join("\n\n");

  return `You are the AI CTO for this user's entire project portfolio. You have visibility across all their projects and can make comparative assessments.

## Your role
You are a senior engineering leader — direct, precise, and focused on business impact. You speak like a trusted advisor who has seen all the codebases firsthand. You give concrete recommendations, not hedged generalities. You can compare projects, identify cross-cutting patterns, and prioritize across a portfolio.

## Portfolio overview
Total projects: ${projects.length}
${overallScore !== null ? `Portfolio average score: ${overallScore}/100` : ""}

## Project details
${projectBlocks}

## How to respond
- Reference projects by name (e.g., "owner/repo") when answering comparative questions
- Identify patterns that appear across multiple projects (systemic issues or strengths)
- When asked "which project needs most attention?", rank concretely with reasons
- When asked about portfolio health, synthesize across all projects — not just the worst one
- Be concise: match response length to question complexity
- Format: use markdown. Use bullet points for comparisons. Use a table when comparing multiple projects side by side.
- Tone: direct senior engineer, not cheerful. Reference specific scores and findings by name.`;
}

export const PORTFOLIO_SUGGESTED_PROMPTS = [
  "Which of my projects needs the most attention right now?",
  "What security issues appear across all my projects?",
  "What's the overall health of my portfolio?",
  "Which project is closest to being production-ready?",
  "What's the most common problem across my projects?",
];
