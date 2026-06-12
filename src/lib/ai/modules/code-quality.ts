import { z } from "zod";
import { db } from "@/lib/db";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildCodeQualitySystemPrompt,
  buildCodeQualityUserPrompt,
} from "@/lib/ai/prompts/code-quality";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const codeQualitySchema = z.object({
  score: z.number().int().min(0).max(100).describe("Code quality score 0–100"),
  summary: z.string().describe("2–3 sentence overview of overall code quality and main themes"),
  findings: z
    .array(findingSchema)
    .describe("Specific code quality issues — only include real, located findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific positive patterns observed (2–5 items)"),
});

export type CodeQualityResult = z.infer<typeof codeQualitySchema>;

export async function runCodeQualityModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "code_quality" } },
    create: { analysisId: bundle.analysisId, module: "code_quality", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: { analysisId_module: { analysisId: bundle.analysisId, module: "code_quality" } },
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
      schema: codeQualitySchema,
      system: buildCodeQualitySystemPrompt(),
      prompt: buildCodeQualityUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "code_quality" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: { ...object, findings: validatedFindings },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "code_quality" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
