// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const MONETIZATION_MODEL = gateway("anthropic/claude-sonnet-4-6");

const monetizationSuggestionSchema = z.object({
  title: z.string().max(100),
  category: z.enum([
    "paywall",
    "pricing",
    "trial",
    "usage-billing",
    "upgrade-prompt",
    "feature-gating",
  ]),
  description: z.string().max(300).describe("What to add or fix and why it improves revenue"),
  revenueImpact: z
    .string()
    .max(150)
    .describe("Specific revenue impact estimate — honest about uncertainty"),
  effortDays: z.number().int().min(1).max(14),
  priority: z.enum(["critical", "high", "medium", "low"]),
});

const monetizationOutputSchema = z.object({
  hasStripeIntegration: z.boolean().describe("True if Stripe or payment integration detected"),
  monetizationScore: z.number().int().min(0).max(100).describe("Monetization readiness 0-100"),
  currentModelAssessment: z
    .string()
    .max(250)
    .describe("Assessment of the current monetization setup (or absence)"),
  suggestions: z
    .array(monetizationSuggestionSchema)
    .min(3)
    .max(8)
    .describe("Monetization improvements"),
  revenueLeak: z
    .array(z.string())
    .max(5)
    .describe("Specific revenue leakage patterns identified (poor paywalls, missing upgrades)"),
  premiumFeatureSuggestions: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("Features that could justify a paid tier based on what this product does"),
});

export type MonetizationSuggestion = z.infer<typeof monetizationSuggestionSchema>;
export type MonetizationOutput = z.infer<typeof monetizationOutputSchema>;

export type MonetizationInput = {
  projectName: string;
  saasMaturityScore: number;
  saasMaturityFindings: Array<{ title: string; severity: string; recommendation?: string }>;
  productReadinessFindings: Array<{ title: string; severity: string }>;
  techStack: string[];
};

export async function adviseOnMonetization(input: MonetizationInput): Promise<MonetizationOutput> {
  const {
    projectName,
    saasMaturityScore,
    saasMaturityFindings,
    productReadinessFindings,
    techStack,
  } = input;

  const saasLines = saasMaturityFindings
    .slice(0, 8)
    .map(
      (f) =>
        `  [${f.severity.toUpperCase()}] ${f.title}${f.recommendation ? ` → ${f.recommendation}` : ""}`
    )
    .join("\n");

  const productLines = productReadinessFindings
    .slice(0, 5)
    .map((f) => `  [${f.severity.toUpperCase()}] ${f.title}`)
    .join("\n");

  const system = `You are an AI CTO analyzing a SaaS product's monetization strategy.

Your analysis must:
- Be specific to this product's codebase — identify what exists vs. what's missing
- Identify revenue leakage: features that should be paywalled but aren't, missing upgrade prompts
- Suggest premium features that make sense for this product type
- Be honest about impact uncertainty
- Avoid generic "add pricing" advice — be specific

Revenue leakage patterns to check:
- Core features accessible without authentication
- Missing upgrade prompts at value moments
- No usage-based limits in place
- Trial mechanics without conversion prompts`;

  const prompt = `Project: ${projectName}
Tech stack: ${techStack.join(", ") || "unknown"}
SaaS Maturity Score: ${saasMaturityScore}/100

SaaS Maturity findings:
${saasLines || "  (none)"}

Product Readiness findings:
${productLines || "  (none)"}

Analyze the monetization setup and identify improvements.`;

  const { object } = await generateObject({
    model: MONETIZATION_MODEL,
    schema: monetizationOutputSchema,
    system,
    prompt,
  });

  return object;
}
