import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import { buildDatabaseSystemPrompt, buildDatabaseUserPrompt } from "@/lib/ai/prompts/database";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const databaseSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Database design quality score 0–100"),
  findings: z
    .array(findingSchema)
    .describe("Database design issues — only include real, specific findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific positive database design characteristics (2–5 items)"),
});

export type DatabaseResult = z.infer<typeof databaseSchema>;

export async function runDatabaseModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "database" } },
    create: { analysisId: bundle.analysisId, module: "database", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: { analysisId_module: { analysisId: bundle.analysisId, module: "database" } },
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
      schema: databaseSchema,
      system: buildDatabaseSystemPrompt(),
      prompt: buildDatabaseUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "database" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("database"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "database" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
