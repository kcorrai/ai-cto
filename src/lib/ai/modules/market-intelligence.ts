import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildMarketIntelligenceSystemPrompt,
  buildMarketIntelligenceUserPrompt,
} from "@/lib/ai/prompts/market-intelligence";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const marketIntelligenceSchema = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Market positioning and competitive readiness score 0–100"),
  summary: z
    .string()
    .describe("2–3 sentence overview of market positioning and competitive standing"),
  productCategory: z
    .string()
    .describe("Detected product category (specific, e.g., 'Developer Tool / Code Review SaaS')"),
  likelyCompetitors: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("3–5 likely direct competitors in this category"),
  differentiationLevel: z
    .enum(["generic", "differentiated", "clearly_unique"])
    .describe("How distinct this product is vs. competitors"),
  targetMarket: z
    .enum(["prosumer", "smb", "mid-market", "enterprise"])
    .describe("Inferred market segment based on feature set and plan structure"),
  findings: z
    .array(findingSchema)
    .describe(
      "Market gaps, table-stakes misses, and positioning issues — only specific, evidence-based findings"
    ),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe(
      "Specific competitive advantages or differentiators visible in the codebase (2–5 items)"
    ),
});

export type MarketIntelligenceResult = z.infer<typeof marketIntelligenceSchema>;

export async function runMarketIntelligenceModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: {
      analysisId_module: { analysisId: bundle.analysisId, module: "market_intelligence" },
    },
    create: {
      analysisId: bundle.analysisId,
      module: "market_intelligence",
      status: "running",
    },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: {
          analysisId_module: { analysisId: bundle.analysisId, module: "market_intelligence" },
        },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: {
            score: 0,
            summary: "Empty repository.",
            productCategory: "Unknown",
            likelyCompetitors: [],
            differentiationLevel: "generic",
            targetMarket: "smb",
            findings: [],
            strengths: [],
          },
          tokenCount: 0,
          durationMs: Date.now() - start,
        },
      });
      return { score: 0 };
    }

    const { object, inputTokens, outputTokens, durationMs } = await generateAnalysis({
      schema: marketIntelligenceSchema,
      system: buildMarketIntelligenceSystemPrompt(),
      prompt: buildMarketIntelligenceUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: {
        analysisId_module: { analysisId: bundle.analysisId, module: "market_intelligence" },
      },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("market_intelligence"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: {
        analysisId_module: { analysisId: bundle.analysisId, module: "market_intelligence" },
      },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
