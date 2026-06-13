// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const REFACTOR_MODEL = gateway("anthropic/claude-sonnet-4-6");

const refactorStepSchema = z.object({
  step: z.number().int().min(1).describe("Step number in sequence"),
  action: z.string().max(200).describe("Specific atomic action to take"),
  verification: z.string().max(150).describe("How to verify this step completed correctly"),
});

const refactorOpportunitySchema = z.object({
  title: z.string().max(100).describe("Short name for this refactor"),
  currentState: z.string().max(250).describe("What exists now and why it's a problem"),
  desiredState: z.string().max(250).describe("What it should look like after refactoring"),
  files: z.array(z.string()).max(5).describe("Key file paths involved (from the codebase)"),
  steps: z.array(refactorStepSchema).min(2).max(8).describe("Atomic steps in safe sequence"),
  risks: z.array(z.string()).max(4).describe("Specific risks — what could go wrong"),
  effortDays: z.number().int().min(1).max(14).describe("Realistic effort estimate"),
  roi: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("ROI score: impact/effort ratio (10 = best return)"),
  testingRequirement: z
    .string()
    .max(150)
    .describe("What tests to run/write to safely complete this refactor"),
});

const refactorOutputSchema = z.object({
  opportunities: z
    .array(refactorOpportunitySchema)
    .min(3)
    .max(5)
    .describe("Top 3-5 refactoring opportunities sorted by ROI (highest first)"),
});

export type RefactorOpportunity = z.infer<typeof refactorOpportunitySchema>;
export type RefactorOutput = z.infer<typeof refactorOutputSchema>;

export type RefactorInput = {
  projectName: string;
  techDebtItems: Array<{
    title: string;
    category: string;
    description: string;
    priority: string;
    effortDaysMin: number;
    effortDaysMax: number;
  }>;
  codeQualityFindings: Array<{
    title: string;
    severity: string;
    filePath?: string;
    recommendation?: string;
  }>;
  architectureFindings: Array<{
    title: string;
    severity: string;
    filePath?: string;
    recommendation?: string;
  }>;
};

export async function planRefactors(input: RefactorInput): Promise<RefactorOutput> {
  const { projectName, techDebtItems, codeQualityFindings, architectureFindings } = input;

  const debtLines = techDebtItems
    .slice(0, 8)
    .map(
      (d) =>
        `  [${d.priority.toUpperCase()}] ${d.title} (${d.category}) — ${d.effortDaysMin}–${d.effortDaysMax}d — ${d.description}`
    )
    .join("\n");

  const codeLines = codeQualityFindings
    .slice(0, 8)
    .map(
      (f) =>
        `  [${f.severity.toUpperCase()}] ${f.title}${f.filePath ? ` in ${f.filePath}` : ""}${f.recommendation ? ` → ${f.recommendation}` : ""}`
    )
    .join("\n");

  const archLines = architectureFindings
    .slice(0, 6)
    .map(
      (f) =>
        `  [${f.severity.toUpperCase()}] ${f.title}${f.filePath ? ` in ${f.filePath}` : ""}${f.recommendation ? ` → ${f.recommendation}` : ""}`
    )
    .join("\n");

  const system = `You are an AI CTO creating actionable refactoring plans for a software team.

Your plans must:
- Identify the TOP 3-5 refactoring opportunities by ROI (impact / effort)
- Name actual files/functions from the findings — no generic "refactor your code"
- Steps must be atomic and independently verifiable
- Risks must be real and specific to this codebase
- Sequence must be safe — dependencies between steps must be correct
- Testing requirements must be concrete
- ROI score: 10 = quick win with high impact, 1 = long effort with low impact

Do NOT over-engineer. Avoid recommending refactors that would add abstraction without clear benefit.`;

  const prompt = `Project: ${projectName}

Technical debt items to address:
${debtLines || "  (none provided)"}

Code quality findings:
${codeLines || "  (none provided)"}

Architecture findings:
${archLines || "  (none provided)"}

Identify the top 3-5 highest-ROI refactoring opportunities with step-by-step plans.`;

  const { object } = await generateObject({
    model: REFACTOR_MODEL,
    schema: refactorOutputSchema,
    system,
    prompt,
  });

  // Sort by ROI descending
  object.opportunities.sort((a, b) => b.roi - a.roi);
  return object;
}
