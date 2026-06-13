// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";
import type { ModuleName } from "@prisma/client";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const ROADMAP_MODEL = gateway("anthropic/claude-opus-4-8");

const roadmapItemSchema = z.object({
  phase: z
    .enum(["now", "next", "later"])
    .describe("now = this week/sprint, next = this month, later = next quarter"),
  title: z.string().max(100).describe("Short action-oriented title starting with a verb"),
  description: z
    .string()
    .max(400)
    .describe("What to do and why it matters — specific to this project"),
  effort: z
    .enum(["low", "medium", "high"])
    .describe("low = 1-2 days, medium = 3-7 days, high = 1-3 weeks"),
  effortDays: z.number().int().min(1).max(21).describe("Specific day estimate"),
  impact: z.enum(["low", "medium", "high"]).describe("Business impact when done"),
  category: z.enum([
    "security",
    "architecture",
    "performance",
    "testing",
    "ux",
    "devops",
    "infrastructure",
    "growth",
  ]),
  findingRefs: z
    .array(z.string())
    .describe("Exact titles of findings this addresses (from the analysis)"),
  dependencies: z.array(z.string()).describe("Titles of other roadmap items this must come after"),
  priority: z.number().int().min(1).max(10).describe("1 = lowest priority, 10 = highest"),
});

const roadmapOutputSchema = z.object({
  summary: z.string().max(200).describe("2-sentence overview of the roadmap's strategic theme"),
  items: z
    .array(roadmapItemSchema)
    .min(10)
    .max(20)
    .describe("10-20 actionable roadmap items across all three phases"),
});

export type RoadmapItem = z.infer<typeof roadmapItemSchema>;
export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;

export type RoadmapInput = {
  projectName: string;
  score: number;
  moduleScores: Partial<Record<ModuleName, number>>;
  allFindings: Array<{
    title: string;
    severity: string;
    module: string;
    recommendation?: string;
    effort?: string;
    impact?: string;
  }>;
};

export async function generateRoadmap(input: RoadmapInput): Promise<RoadmapOutput> {
  const { projectName, score, moduleScores, allFindings } = input;

  const moduleLines = Object.entries(moduleScores)
    .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0))
    .map(([mod, s]) => `  - ${mod.replace(/_/g, " ")}: ${s}/100`)
    .join("\n");

  const criticalFindings = allFindings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 15)
    .map(
      (f) =>
        `  [${f.severity.toUpperCase()}] ${f.title} (${f.module})${f.effort ? ` effort:${f.effort}` : ""}${f.impact ? ` impact:${f.impact}` : ""}`
    )
    .join("\n");

  const mediumFindings = allFindings
    .filter((f) => f.severity === "medium")
    .slice(0, 10)
    .map((f) => `  [MEDIUM] ${f.title} (${f.module})`)
    .join("\n");

  const system = `You are an AI CTO creating a prioritized development roadmap for a software team.

Your roadmap must:
- Contain 10–20 items across three phases: "now" (this week), "next" (this month), "later" (next quarter)
- Synthesize findings into actionable epics — NOT a direct copy of findings
- Group by strategic theme (security hardening, test coverage, observability) not by module
- Prioritize: critical security first, then stability, then growth
- Quick wins (low effort + high impact) go in "now" even if non-critical
- Effort estimates must be calibrated: distribute across low/medium/high realistically
- Dependencies must be real — only list when items are truly sequential

Phase assignment:
- now: critical security issues, quick wins (≤2 days, high impact), things blocking other work
- next: medium improvements (3–7 days), architecture work, test coverage
- later: long-term investments (1–3 weeks), major refactors, infrastructure upgrades

Do not produce generic advice. Every item must reference actual finding titles.`;

  const prompt = `Project: ${projectName}
SaaS Score: ${score}/100

Module scores (weakest first):
${moduleLines}

Critical/High findings to address:
${criticalFindings || "  (none)"}

Medium findings to consider for next/later:
${mediumFindings || "  (none)"}

Generate the prioritized 3-month development roadmap. Reference the actual finding titles above.`;

  const { object } = await generateObject({
    model: ROADMAP_MODEL,
    schema: roadmapOutputSchema,
    system,
    prompt,
  });

  return object;
}
