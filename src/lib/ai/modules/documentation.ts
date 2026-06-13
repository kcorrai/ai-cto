import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildDocumentationSystemPrompt,
  buildDocumentationUserPrompt,
} from "@/lib/ai/prompts/documentation";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const documentationSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Documentation quality score 0–100"),
  findings: z
    .array(findingSchema)
    .describe("Documentation gaps — only include real, specific findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific positive documentation characteristics (2–5 items)"),
});

export type DocumentationResult = z.infer<typeof documentationSchema>;

export async function runDocumentationModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "documentation" } },
    create: { analysisId: bundle.analysisId, module: "documentation", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: { analysisId_module: { analysisId: bundle.analysisId, module: "documentation" } },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: { score: 0, findings: [], strengths: [] },
          tokenCount: 0,
          durationMs: Date.now() - start,
        },
      });
      return { score: 0 };
    }

    const { object, inputTokens, outputTokens, durationMs } = await generateAnalysis({
      schema: documentationSchema,
      system: buildDocumentationSystemPrompt(),
      prompt: buildDocumentationUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "documentation" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("documentation"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "documentation" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
