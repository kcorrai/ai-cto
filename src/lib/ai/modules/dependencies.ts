import { z } from "zod";
import { db } from "@/lib/db";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildDependenciesSystemPrompt,
  buildDependenciesUserPrompt,
} from "@/lib/ai/prompts/dependencies";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const dependenciesSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Dependency health score 0–100"),
  summary: z.string().describe("2–3 sentence overview of dependency health"),
  findings: z
    .array(findingSchema)
    .describe("Dependency issues — only include real, specific findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Positive dependency management practices (2–5 items)"),
});

export type DependenciesResult = z.infer<typeof dependenciesSchema>;

export async function runDependenciesModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "dependencies" } },
    create: { analysisId: bundle.analysisId, module: "dependencies", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: { analysisId_module: { analysisId: bundle.analysisId, module: "dependencies" } },
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
      schema: dependenciesSchema,
      system: buildDependenciesSystemPrompt(),
      prompt: buildDependenciesUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "dependencies" } },
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
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "dependencies" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
