// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const GROWTH_MODEL = gateway("anthropic/claude-opus-4-8");

const growthSuggestionSchema = z.object({
  title: z.string().max(100).describe("Short name for the growth improvement"),
  category: z.enum([
    "onboarding",
    "retention",
    "virality",
    "freemium",
    "engagement",
    "reactivation",
  ]),
  description: z.string().max(300).describe("What to build and why it improves growth"),
  estimatedImpact: z
    .string()
    .max(150)
    .describe("Specific estimated impact — be honest about uncertainty"),
  effortDays: z.number().int().min(1).max(21).describe("Effort estimate"),
  priority: z.enum(["critical", "high", "medium", "low"]),
  isPresent: z.boolean().describe("True if this feature already exists in the codebase"),
});

const growthOutputSchema = z.object({
  onboardingAssessment: z
    .string()
    .max(200)
    .describe("Assessment of the current onboarding flow (or lack thereof)"),
  retentionScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Estimated retention readiness 0-100 based on codebase signals"),
  suggestions: z
    .array(growthSuggestionSchema)
    .min(4)
    .max(10)
    .describe("Growth improvement suggestions"),
  missingCritical: z
    .array(z.string())
    .max(5)
    .describe("Critical growth features completely absent from the codebase"),
});

export type GrowthSuggestion = z.infer<typeof growthSuggestionSchema>;
export type GrowthOutput = z.infer<typeof growthOutputSchema>;

export type GrowthInput = {
  projectName: string;
  saasMaturityScore: number;
  productReadinessScore: number;
  saasMaturityFindings: Array<{ title: string; severity: string; recommendation?: string }>;
  productReadinessFindings: Array<{ title: string; severity: string; recommendation?: string }>;
  techStack: string[];
};

export async function adviseOnGrowth(input: GrowthInput): Promise<GrowthOutput> {
  const {
    projectName,
    saasMaturityScore,
    productReadinessScore,
    saasMaturityFindings,
    productReadinessFindings,
    techStack,
  } = input;

  function formatFindings(
    findings: Array<{ title: string; severity: string; recommendation?: string }>
  ) {
    return findings
      .slice(0, 8)
      .map(
        (f) =>
          `  [${f.severity.toUpperCase()}] ${f.title}${f.recommendation ? ` → ${f.recommendation}` : ""}`
      )
      .join("\n");
  }

  const system = `You are an AI CTO specializing in SaaS growth and retention mechanics.

Your analysis must:
- Focus on product-level growth mechanics, NOT marketing or ads
- Identify features that directly improve user retention and activation
- Be specific to this product's codebase — don't give advice for features already present
- Impact estimates must be labeled as estimates with uncertainty
- Practical for indie hackers and small teams to implement
- Onboarding, retention hooks, empty states, email sequences, freemium conversion

Categories:
- onboarding: new user activation flow (time-to-value)
- retention: features that keep users coming back
- virality: viral loops, referral mechanisms, sharing
- freemium: free-to-paid conversion mechanics
- engagement: notifications, digests, progress indicators
- reactivation: bringing back churned/dormant users`;

  const prompt = `Project: ${projectName}
Tech stack: ${techStack.join(", ") || "unknown"}
SaaS Maturity Score: ${saasMaturityScore}/100
Product Readiness Score: ${productReadinessScore}/100

SaaS Maturity findings:
${formatFindings(saasMaturityFindings) || "  (none)"}

Product Readiness findings:
${formatFindings(productReadinessFindings) || "  (none)"}

Identify growth and retention improvements. Focus on product mechanics, not marketing.`;

  const { object } = await generateObject({
    model: GROWTH_MODEL,
    schema: growthOutputSchema,
    system,
    prompt,
  });

  return object;
}
