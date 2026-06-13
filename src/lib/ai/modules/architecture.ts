import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildArchitectureSystemPrompt,
  buildArchitectureUserPrompt,
} from "@/lib/ai/prompts/architecture";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const architectureSchema = z.object({
  score: z.number().int().min(0).max(100).describe("Architecture quality score 0–100"),
  pattern: z
    .string()
    .describe(
      "Primary architectural pattern (e.g. Next.js App Router, MVC, Layered, Event-driven)"
    ),
  findings: z
    .array(findingSchema)
    .describe("Architectural issues — only include real, specific findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific positive aspects of this architecture (2–5 items)"),
});

export type ArchitectureResult = z.infer<typeof architectureSchema>;

export async function runArchitectureModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  // Upsert so retries don't violate the unique(analysisId, module) constraint
  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "architecture" } },
    create: { analysisId: bundle.analysisId, module: "architecture", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    // Empty bundle — graceful no-op
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: { analysisId_module: { analysisId: bundle.analysisId, module: "architecture" } },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: { score: 0, pattern: "Empty", findings: [], strengths: [] },
          tokenCount: 0,
          durationMs: Date.now() - start,
        },
      });
      return { score: 0 };
    }

    const { object, inputTokens, outputTokens, durationMs } = await generateAnalysis({
      schema: architectureSchema,
      system: buildArchitectureSystemPrompt(),
      prompt: buildArchitectureUserPrompt(bundle),
    });

    // Validate filePaths — filter findings that reference non-existent paths
    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "architecture" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("architecture"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "architecture" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
