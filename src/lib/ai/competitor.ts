// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const COMPETITOR_MODEL = gateway("anthropic/claude-opus-4-8");

const competitorFeatureSchema = z.object({
  feature: z.string().max(100).describe("Feature name — short and specific"),
  description: z.string().max(300).describe("What this feature is and why competitors have it"),
  confidence: z
    .enum(["certain", "likely", "possible"])
    .describe(
      "certain = industry standard, likely = category norm, possible = inferred from context"
    ),
  group: z
    .enum(["must-have", "differentiator", "nice-to-have"])
    .describe(
      "must-have = table stakes, differentiator = competitive advantage, nice-to-have = polish"
    ),
});

const competitorOutputSchema = z.object({
  inferredCategory: z
    .string()
    .max(100)
    .describe("Product category inferred from the codebase (e.g. 'B2B SaaS analytics tool')"),
  competitors: z
    .array(z.string())
    .max(5)
    .describe("Competitor names used for comparison (provided or inferred)"),
  gaps: z
    .array(competitorFeatureSchema)
    .min(5)
    .max(20)
    .describe("Features competitors likely have that this project lacks"),
  presentFeatures: z
    .array(z.string())
    .min(3)
    .max(10)
    .describe("Key features this project DOES have that are competitive strengths"),
  disclaimer: z
    .string()
    .max(200)
    .describe("Brief note about inference confidence — what this is and isn't based on"),
});

export type CompetitorFeature = z.infer<typeof competitorFeatureSchema>;
export type CompetitorOutput = z.infer<typeof competitorOutputSchema>;

export type CompetitorInput = {
  projectName: string;
  techStack: string[];
  competitorNames?: string[];
  fileList: string[];
  configFiles: string[];
  topFindings: Array<{ title: string; severity: string; module: string }>;
  moduleScores: Record<string, number>;
};

export async function analyzeCompetitors(input: CompetitorInput): Promise<CompetitorOutput> {
  const {
    projectName,
    techStack,
    competitorNames,
    fileList,
    configFiles,
    topFindings,
    moduleScores,
  } = input;

  const competitorContext = competitorNames?.length
    ? `Competitors to compare against: ${competitorNames.join(", ")}`
    : "No competitors specified — infer the product category and relevant competitors from the codebase.";

  const fileContext = fileList.slice(0, 50).join(", ");
  const configContext = configFiles.join(", ");
  const findingContext = topFindings
    .slice(0, 8)
    .map((f) => `  - [${f.severity.toUpperCase()}] ${f.title} (${f.module})`)
    .join("\n");
  const scoreContext = Object.entries(moduleScores)
    .sort(([, a], [, b]) => a - b)
    .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}/100`)
    .join("\n");

  const system = `You are an AI CTO performing a competitive gap analysis for a software product.

Your analysis must:
- Be specific to THIS project's actual codebase — not generic SaaS advice
- Group gaps as: must-have (table stakes for the category), differentiator (competitive edge), nice-to-have (polish)
- Be honest about confidence: "certain" only for clear industry standards, "likely" for category norms, "possible" for inferences
- Identify features competitors have that this project LACKS — not the other way around
- Also identify 3-10 features this project DOES have that are competitive strengths
- NEVER claim to have scraped competitor websites — this is knowledge-based inference only

Confidence levels:
- certain: industry standard (e.g., all CRMs have contact management)
- likely: category norm (e.g., most analytics tools have CSV export)
- possible: inferred from project context (e.g., based on the tech stack, team collaboration features may be expected)`;

  const prompt = `Project: ${projectName}
Tech stack: ${techStack.join(", ") || "unknown"}

Key files: ${fileContext || "unknown"}
Config files: ${configContext || "none"}

${competitorContext}

Current analysis gaps (module scores):
${scoreContext || "  (none)"}

Top findings:
${findingContext || "  (none)"}

Analyze what features competitors in this space likely have that this project lacks. Be specific and honest about confidence.`;

  const { object } = await generateObject({
    model: COMPETITOR_MODEL,
    schema: competitorOutputSchema,
    system,
    prompt,
  });

  return object;
}
