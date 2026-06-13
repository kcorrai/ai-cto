// v1 — 2026-06-12

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/env";
import type { ModuleName } from "@prisma/client";
import type { SaaSScoreLabel } from "@/lib/scoring/saas-score";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

// Synthesis uses the strongest model — TASK-019 spec
const SYNTHESIS_MODEL = gateway("anthropic/claude-opus-4-8");

const MODULE_DISPLAY_NAMES: Partial<Record<ModuleName, string>> = {
  architecture: "Architecture",
  code_quality: "Code Quality",
  security: "Security",
  dependencies: "Dependencies",
  product_readiness: "Product Readiness",
  performance: "Performance",
  testing: "Testing",
  documentation: "Documentation",
  api_design: "API Design",
  database: "Database Design",
  devops: "DevOps / CI",
  saas_maturity: "SaaS Maturity",
  product_manager: "Product Manager",
  market_intelligence: "Market Intelligence",
};

export type CriticalFinding = {
  title: string;
  severity: string;
  module: string;
  recommendation: string;
  filePath?: string;
};

export type SynthesisInput = {
  projectName: string;
  score: number;
  label: SaaSScoreLabel;
  moduleScores: Partial<Record<ModuleName, number>>;
  topFindings: CriticalFinding[];
};

// Identify cross-cutting patterns across module scores and findings
function buildCrossCuttingContext(
  moduleScores: Partial<Record<ModuleName, number>>,
  topFindings: CriticalFinding[]
): string {
  const lines: string[] = [];

  // Count modules below threshold
  const criticalModules = Object.entries(moduleScores)
    .filter(([, s]) => (s ?? 100) < 40)
    .map(([m]) => MODULE_DISPLAY_NAMES[m as ModuleName] ?? m);
  if (criticalModules.length >= 3) {
    lines.push(
      `Systemic concern: ${criticalModules.length} modules are critically weak (${criticalModules.slice(0, 3).join(", ")}${criticalModules.length > 3 ? "…" : ""}) — this suggests foundational issues, not isolated gaps.`
    );
  }

  // Findings spanning multiple modules with the same file
  const fileModuleMap: Record<string, Set<string>> = {};
  for (const f of topFindings) {
    if (!f.filePath) continue;
    if (!fileModuleMap[f.filePath]) fileModuleMap[f.filePath] = new Set();
    fileModuleMap[f.filePath]!.add(f.module);
  }
  const hotFiles = Object.entries(fileModuleMap)
    .filter(([, mods]) => mods.size >= 2)
    .map(([file, mods]) => `${file} (flagged by ${[...mods].join(", ")})`);
  if (hotFiles.length > 0) {
    lines.push(
      `Hot-spot files flagged across multiple modules: ${hotFiles.slice(0, 2).join("; ")}.`
    );
  }

  // Severity distribution
  const critCount = topFindings.filter((f) => f.severity === "critical").length;
  const highCount = topFindings.filter((f) => f.severity === "high").length;
  if (critCount > 0) {
    lines.push(
      `${critCount} critical finding${critCount > 1 ? "s" : ""} and ${highCount} high-severity finding${highCount !== 1 ? "s" : ""} require immediate attention.`
    );
  }

  return lines.length > 0
    ? `\nCross-module insights:\n${lines.map((l) => `  - ${l}`).join("\n")}`
    : "";
}

export async function generateExecutiveSummary(input: SynthesisInput): Promise<string> {
  const { projectName, score, label, moduleScores, topFindings } = input;

  const moduleLines = Object.entries(moduleScores)
    .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0))
    .map(([mod, s]) => `  - ${MODULE_DISPLAY_NAMES[mod as ModuleName] ?? mod}: ${s}/100`)
    .join("\n");

  const weakestModule = Object.entries(moduleScores).sort(
    ([, a], [, b]) => (a ?? 100) - (b ?? 100)
  )[0];
  const weakestName = weakestModule
    ? (MODULE_DISPLAY_NAMES[weakestModule[0] as ModuleName] ?? weakestModule[0])
    : "unknown";

  const findingLines = topFindings
    .slice(0, 5)
    .map(
      (f, i) =>
        `  ${i + 1}. [${f.severity.toUpperCase()}] "${f.title}" — ${f.module}${f.filePath ? ` (${f.filePath})` : ""}\n     Fix: ${f.recommendation}`
    )
    .join("\n");

  const crossCuttingContext = buildCrossCuttingContext(moduleScores, topFindings);

  const system = `You are an AI CTO writing a technical executive summary for a founder.

Your summary must:
- Be 300–400 words in 3–4 tight paragraphs
- Open with the score and label, framed as a starting point not a verdict
- Reference at least 2 specific finding titles by name (use the exact titles provided)
- Name the weakest module explicitly
- If cross-module insights are provided, weave them into the narrative — they indicate systemic issues
- End with one clear, concrete priority action the founder should take this week
- Use direct, confident language — no hedging ("might", "could consider", "perhaps")
- Use "Your project" framing throughout
- Never be generic — every sentence must be specific to this project's actual data`;

  const prompt = `Project: ${projectName}
SaaS Score: ${score}/100 — ${label}
Weakest module: ${weakestName}

Module scores (lowest first):
${moduleLines}
${crossCuttingContext}

Top findings:
${findingLines}

Write the executive summary now.`;

  const { text } = await generateText({
    model: SYNTHESIS_MODEL,
    system,
    prompt,
    maxOutputTokens: 800,
  });

  return text.trim();
}
