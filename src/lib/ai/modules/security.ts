import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import { buildSecuritySystemPrompt, buildSecurityUserPrompt } from "@/lib/ai/prompts/security";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const securitySchema = z.object({
  score: z.number().int().min(0).max(100).describe("Security posture score 0–100"),
  summary: z.string().describe("2–3 sentence overview of the overall security posture"),
  findings: z
    .array(findingSchema)
    .describe("Security vulnerabilities and risks — only include real, located findings"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific security positives observed (2–5 items)"),
});

export type SecurityResult = z.infer<typeof securitySchema>;

export async function runSecurityModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: { analysisId_module: { analysisId: bundle.analysisId, module: "security" } },
    create: { analysisId: bundle.analysisId, module: "security", status: "running" },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: { analysisId_module: { analysisId: bundle.analysisId, module: "security" } },
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
      schema: securitySchema,
      system: buildSecuritySystemPrompt(),
      prompt: buildSecurityUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "security" } },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("security"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: { analysisId_module: { analysisId: bundle.analysisId, module: "security" } },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - start,
      },
    });
    throw error;
  }
}
