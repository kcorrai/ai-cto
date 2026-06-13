// v1 — 2026-06-12

type ModuleScore = { module: string; score: number };
type FindingSummary = { severity: string; title: string; module: string };

type AdvisorContext = {
  projectName: string;
  score: number;
  label: string;
  moduleScores: ModuleScore[];
  topFindings: FindingSummary[];
  summary: string | null;
};

export function createAdvisorSystemPrompt(ctx: AdvisorContext): string {
  const moduleLines = ctx.moduleScores
    .sort((a, b) => a.score - b.score)
    .map((m) => `  - ${m.module.replace(/_/g, " ")}: ${m.score}/100`)
    .join("\n");

  const findingLines = ctx.topFindings
    .slice(0, 5)
    .map((f) => `  - [${f.severity.toUpperCase()}] ${f.title} (${f.module.replace(/_/g, " ")})`)
    .join("\n");

  return `You are the AI CTO for ${ctx.projectName}. You have just completed a full technical analysis of this codebase.

## Your role
You are a senior engineering leader — direct, precise, and focused on business impact. You speak like a trusted advisor who has seen the codebase firsthand. You do not hedge with "it depends" without immediately giving a concrete recommendation. You do not pad responses with filler phrases.

## Analysis results you have access to
SaaS Score: ${ctx.score}/100 (${ctx.label})

Module scores:
${moduleLines}

Top findings:
${findingLines}

Executive summary:
${ctx.summary ?? "No summary available."}

## How to respond
- Be specific: reference actual modules, scores, and findings by name
- Be concise: match response length to question complexity; don't over-explain simple questions
- Be actionable: every answer should end with a clear next step or recommendation
- If asked about something outside the analysis, say so and answer from general engineering expertise
- Format: use markdown. Use code blocks for code snippets. Use bullet points for lists of items. Never use headers in short conversational responses.
- Tone: direct, not cheerful. Like reading a senior engineer's Slack message, not a marketing blog post.`;
}

export function generateSuggestedPrompts(ctx: AdvisorContext): string[] {
  const prompts: string[] = [];

  // Weakest module
  const sorted = [...ctx.moduleScores].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  if (weakest) {
    prompts.push(
      `What's the most important thing to fix in ${weakest.module.replace(/_/g, " ")} (score: ${weakest.score}/100)?`
    );
  }

  // Top critical/high finding
  const criticalFinding = ctx.topFindings.find(
    (f) => f.severity === "critical" || f.severity === "high"
  );
  if (criticalFinding) {
    prompts.push(`How do I fix: "${criticalFinding.title}"?`);
  }

  // Score-based prompt
  if (ctx.score < 50) {
    prompts.push("What are the three most important things I need to do before launch?");
  } else if (ctx.score < 75) {
    prompts.push("What's blocking me from reaching a launch-ready score?");
  } else {
    prompts.push("What should I focus on to go from nearly there to fully launch-ready?");
  }

  // General strategy
  prompts.push("Give me a prioritized 30-day roadmap based on this analysis.");

  return prompts.slice(0, 4);
}
