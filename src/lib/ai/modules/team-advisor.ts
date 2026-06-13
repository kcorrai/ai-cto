import { z } from "zod";
import { db } from "@/lib/db";
import { getPromptVariant } from "@/lib/ai/ab-testing";
import { generateAnalysis } from "@/lib/ai/gateway";
import {
  buildTeamAdvisorSystemPrompt,
  buildTeamAdvisorUserPrompt,
} from "@/lib/ai/prompts/team-advisor";
import { findingSchema } from "@/lib/ai/schemas";
import type { RepoBundle } from "@/lib/github/fetcher";

const teamAdvisorSchema = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Engineering process maturity and team structure score 0–100"),
  summary: z.string().describe("2–3 sentence overview of team structure and process maturity"),
  processMaturityStage: z
    .enum(["ad-hoc", "basic", "defined", "optimized"])
    .describe("Detected engineering process maturity stage"),
  skillsPresent: z
    .array(z.string())
    .describe("Engineering disciplines clearly evidenced in the codebase"),
  skillsWeak: z.array(z.string()).describe("Engineering disciplines that appear weak or missing"),
  topHiringPriority: z.string().describe("The most impactful next hire based on skill gaps"),
  findings: z
    .array(findingSchema)
    .describe(
      "Process gaps, skill deficiencies, and team bottlenecks — specific and evidence-based"
    ),
  strengths: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Specific engineering process strengths visible in the codebase (2–5 items)"),
});

export type TeamAdvisorResult = z.infer<typeof teamAdvisorSchema>;

export async function runTeamAdvisorModule(bundle: RepoBundle): Promise<{ score: number }> {
  const start = Date.now();

  await db.analysisModule.upsert({
    where: {
      analysisId_module: { analysisId: bundle.analysisId, module: "team_advisor" },
    },
    create: {
      analysisId: bundle.analysisId,
      module: "team_advisor",
      status: "running",
    },
    update: { status: "running", errorMessage: null },
  });

  try {
    if (bundle.files.length === 0) {
      await db.analysisModule.update({
        where: {
          analysisId_module: { analysisId: bundle.analysisId, module: "team_advisor" },
        },
        data: {
          status: "complete",
          score: 0,
          findings: [],
          rawOutput: {
            score: 0,
            summary: "Empty repository.",
            processMaturityStage: "ad-hoc",
            skillsPresent: [],
            skillsWeak: [],
            topHiringPriority: "Unknown",
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
      schema: teamAdvisorSchema,
      system: buildTeamAdvisorSystemPrompt(),
      prompt: buildTeamAdvisorUserPrompt(bundle),
    });

    const validPaths = new Set(bundle.files.map((f) => f.path));
    const validatedFindings = object.findings.map((f) => ({
      ...f,
      filePath: f.filePath && validPaths.has(f.filePath) ? f.filePath : undefined,
    }));

    await db.analysisModule.update({
      where: {
        analysisId_module: { analysisId: bundle.analysisId, module: "team_advisor" },
      },
      data: {
        status: "complete",
        score: object.score,
        findings: validatedFindings,
        rawOutput: {
          ...object,
          findings: validatedFindings,
          promptVariant: getPromptVariant("team_advisor"),
        },
        tokenCount: inputTokens + outputTokens,
        durationMs,
      },
    });

    return { score: object.score };
  } catch (error) {
    await db.analysisModule.update({
      where: {
        analysisId_module: { analysisId: bundle.analysisId, module: "team_advisor" },
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
