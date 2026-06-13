// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const DEBT_MODEL = gateway("anthropic/claude-opus-4-8");

const debtItemSchema = z.object({
  title: z.string().max(120).describe("Short description of the debt item"),
  category: z.enum(["architecture", "code", "test", "documentation", "dependency"]),
  description: z.string().max(350).describe("What the debt is and why it accumulates"),
  remediation: z.string().max(250).describe("How to pay down this debt"),
  effortDaysMin: z.number().int().min(1).max(60).describe("Optimistic estimate in days"),
  effortDaysMax: z.number().int().min(1).max(60).describe("Pessimistic estimate in days"),
  businessImpact: z
    .string()
    .max(200)
    .describe("Concrete business impact — velocity tax, risk, or opportunity cost"),
  velocityTaxPct: z
    .number()
    .int()
    .min(0)
    .max(50)
    .describe("Estimated % velocity reduction this debt causes (0 if not measurable)"),
  priority: z.enum(["critical", "high", "medium", "low"]).describe("Debt priority to address"),
});

const debtOutputSchema = z.object({
  totalEstimateDaysMin: z
    .number()
    .int()
    .min(0)
    .describe("Sum of optimistic estimates across all debt items"),
  totalEstimateDaysMax: z
    .number()
    .int()
    .min(0)
    .describe("Sum of pessimistic estimates across all debt items"),
  aggregateVelocityTax: z
    .number()
    .int()
    .min(0)
    .max(80)
    .describe("Overall velocity reduction estimate as %"),
  headline: z
    .string()
    .max(150)
    .describe("One sentence describing the state of the codebase's debt (honest, quantified)"),
  items: z.array(debtItemSchema).min(3).max(15).describe("Individual technical debt items"),
});

export type DebtItem = z.infer<typeof debtItemSchema>;
export type TechnicalDebtOutput = z.infer<typeof debtOutputSchema>;

export type TechnicalDebtInput = {
  projectName: string;
  score: number;
  moduleScores: Record<string, number>;
  architectureFindings: Array<{ title: string; severity: string; recommendation?: string }>;
  codeQualityFindings: Array<{ title: string; severity: string; recommendation?: string }>;
  testingFindings: Array<{ title: string; severity: string; recommendation?: string }>;
  allOtherFindings: Array<{ title: string; severity: string; module: string }>;
};

export async function scanTechnicalDebt(input: TechnicalDebtInput): Promise<TechnicalDebtOutput> {
  const {
    projectName,
    score,
    moduleScores,
    architectureFindings,
    codeQualityFindings,
    testingFindings,
    allOtherFindings,
  } = input;

  const moduleLines = Object.entries(moduleScores)
    .sort(([, a], [, b]) => a - b)
    .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}/100`)
    .join("\n");

  function formatFindings(
    findings: Array<{ title: string; severity: string; recommendation?: string }>
  ) {
    return findings
      .slice(0, 10)
      .map(
        (f) =>
          `  [${f.severity.toUpperCase()}] ${f.title}${f.recommendation ? ` → ${f.recommendation}` : ""}`
      )
      .join("\n");
  }

  const otherLines = allOtherFindings
    .slice(0, 10)
    .map((f) => `  [${f.severity.toUpperCase()}] ${f.title} (${f.module})`)
    .join("\n");

  const system = `You are an AI CTO quantifying the technical debt of a software project for its founder.

Your inventory must:
- Be honest and specific — reference actual issues from the findings, not generic patterns
- Give bounded estimates ("2–4 days", never false precision)
- Business framing must be credible: "This test debt is slowing feature velocity by ~15%" not "debt is bad"
- Velocity tax should be conservative (most teams overestimate debt impact)
- Aggregate velocity tax should be the overall picture, not the sum of all items (effects overlap)
- The headline must be a single honest sentence with a number (e.g. "~30–55 developer-days of debt")

Categories:
- architecture: structural patterns, coupling, separation of concerns
- code: duplication, complexity, readability, error handling
- test: missing coverage, low-quality tests, brittle tests
- documentation: missing/outdated docs, unclear API contracts
- dependency: outdated, vulnerable, or unnecessary dependencies`;

  const prompt = `Project: ${projectName}
SaaS Score: ${score}/100

Module scores (weakest first):
${moduleLines}

Architecture findings:
${formatFindings(architectureFindings) || "  (none)"}

Code quality findings:
${formatFindings(codeQualityFindings) || "  (none)"}

Testing findings:
${formatFindings(testingFindings) || "  (none)"}

Other findings (documentation, dependencies, etc.):
${otherLines || "  (none)"}

Inventory the technical debt. Synthesize findings into debt items — don't just copy findings.`;

  const { object } = await generateObject({
    model: DEBT_MODEL,
    schema: debtOutputSchema,
    system,
    prompt,
  });

  return object;
}
