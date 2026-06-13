import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildSecurityOwaspSystemPrompt,
  buildSecurityOwaspUserPrompt,
  OWASP_CATEGORIES,
} from "@/lib/ai/prompts/security-owasp";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const owaspCategorySchema = z.object({
  category: z.enum(OWASP_CATEGORIES).describe("OWASP Top 10 category"),
  status: z.enum(["pass", "warning", "fail"]).describe("Overall status for this category"),
  notes: z.string().describe("Brief evidence-based note on this category (1–2 sentences)"),
});

const securityOwaspSchema = z.object({
  score: z.number().int().min(0).max(100).describe("OWASP security audit score 0–100"),
  summary: z.string().describe("2–3 sentence overview of the security posture"),
  owaspResults: z
    .array(owaspCategorySchema)
    .length(10)
    .describe("Results for each of the 10 OWASP categories"),
  findings: z
    .array(findingSchema)
    .describe("Specific security findings — only confirmed or highly probable issues"),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific security strengths visible in the codebase (2–5 items)"),
});

export type SecurityOwaspResult = z.infer<typeof securityOwaspSchema>;

export async function runSecurityOwaspModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: {
      analysisId_module: { analysisId: bundle.analysisId, module: "security_owasp" },
    },
    create: {
      analysisId: bundle.analysisId,
      module: "security_owasp",
      status: "running",
    },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: {
          analysisId_module: { analysisId: bundle.analysisId, module: "security_owasp" },
        },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: {
            score: 0,
            summary: "Empty repository.",
            owaspResults: [],
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
      schema: securityOwaspSchema,
      system: buildSecurityOwaspSystemPrompt(),
      prompt: buildSecurityOwaspUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: {
        analysisId_module: { analysisId: bundle.analysisId, module: "security_owasp" },
      },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("security_owasp"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: {
        analysisId_module: { analysisId: bundle.analysisId, module: "security_owasp" },
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
