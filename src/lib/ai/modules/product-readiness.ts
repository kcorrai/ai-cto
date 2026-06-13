import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildProductReadinessSystemPrompt,
  buildProductReadinessUserPrompt,
} from "@/lib/ai/prompts/product-readiness";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const productReadinessSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Product readiness score 0–100"),
  summary: z
    .string()
    .describe("2–3 sentence overview of product readiness from a user perspective"),
  findings: z
    .array(findingSchema)
    .describe("Product readiness gaps — only include real, specific findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific user-facing positives (2–5 items)"),
});

export type ProductReadinessResult = z.infer<typeof productReadinessSchema>;

export async function runProductReadinessModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "product_readiness" } },
    create: { analysisId: bundle.analysisId, module: "product_readiness", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: {
          analysisId_module: { analysisId: bundle.analysisId, module: "product_readiness" },
        },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: { score: 0, summary: "Empty repository.", findings: [], strengths: [] },
          tokenCount: 0,
          durationMs: Date.now() - start,
        },
      });
      return { score: 0 };
    }

    const { object, inputTokens, outputTokens, durationMs } = await generateAnalysis({
      schema: productReadinessSchema,
      system: buildProductReadinessSystemPrompt(),
      prompt: buildProductReadinessUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "product_readiness" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("product_readiness"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "product_readiness" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
