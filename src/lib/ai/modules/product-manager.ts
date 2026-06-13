import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildProductManagerSystemPrompt,
  buildProductManagerUserPrompt,
} from "@/lib/ai/prompts/product-manager";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const productManagerSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Product completeness score 0–100"),
  summary: z
    .string()
    .describe("2–3 sentence overview of product completeness from a user perspective"),
  productCategory: z
    .string()
    .describe("Detected product category (e.g., 'Project Management SaaS', 'Dev Tool')"),
  findings: z
    .array(findingSchema)
    .describe("Product gaps and incomplete flows — only specific, evidence-based findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific product positives that serve users well (2–5 items)"),
  userStories: z
    .array(z.string())
    .min(0)
    .max(3)
    .describe(
      "Top 3 user stories for missing/incomplete features (format: 'As a [user], I want to [action] so that [benefit]')"
    ),
});

export type ProductManagerResult = z.infer<typeof productManagerSchema>;

export async function runProductManagerModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "product_manager" } },
    create: { analysisId: bundle.analysisId, module: "product_manager", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: {
          analysisId_module: { analysisId: bundle.analysisId, module: "product_manager" },
        },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: {
            score: 0,
            summary: "Empty repository.",
            productCategory: "Unknown",
            findings: [],
            strengths: [],
            userStories: [],
          },
          tokenCount: 0,
          durationMs: Date.now() - start,
        },
      });
      return { score: 0 };
    }

    const { object, inputTokens, outputTokens, durationMs } = await generateAnalysis({
      schema: productManagerSchema,
      system: buildProductManagerSystemPrompt(),
      prompt: buildProductManagerUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "product_manager" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("product_manager"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "product_manager" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
