// v1 — 2026-06-12
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { env } from "@/env";

const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

const LAUNCH_MODEL = gateway("anthropic/claude-opus-4-8");

const launchIssueSchema = z.object({
  title: z.string().max(150).describe("Short issue description"),
  category: z.enum(["security", "stability", "ux", "legal"]),
  severity: z
    .enum(["blocking", "advisory"])
    .describe("blocking = must fix before launch, advisory = should fix"),
  remediation: z.string().max(250).describe("Specific fix to resolve this issue"),
  effortDays: z.number().int().min(1).max(30).describe("Estimated days to fix"),
});

const launchOutputSchema = z.object({
  launchScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Launch readiness score 0-100, independent of SaaS Score"),
  verdict: z
    .enum(["launch-ready", "not-ready"])
    .describe("Honest verdict — not-ready if any blocking issues exist"),
  verdictReason: z.string().max(200).describe("One clear sentence explaining the verdict"),
  totalBlockingDays: z
    .number()
    .int()
    .min(0)
    .describe("Total estimated days to fix all blocking issues"),
  issues: z
    .array(launchIssueSchema)
    .min(3)
    .max(20)
    .describe("All blocking and advisory launch issues"),
  passedChecks: z
    .array(z.string())
    .min(2)
    .max(10)
    .describe("Launch criteria this project already meets"),
});

export type LaunchIssue = z.infer<typeof launchIssueSchema>;
export type LaunchOutput = z.infer<typeof launchOutputSchema>;

export type LaunchReadinessInput = {
  projectName: string;
  score: number;
  moduleScores: Record<string, number>;
  criticalFindings: Array<{
    title: string;
    severity: string;
    module: string;
    recommendation?: string;
  }>;
  allFindingTitles: string[];
};

export async function assessLaunchReadiness(input: LaunchReadinessInput): Promise<LaunchOutput> {
  const { projectName, score, moduleScores, criticalFindings, allFindingTitles } = input;

  const moduleLines = Object.entries(moduleScores)
    .sort(([, a], [, b]) => a - b)
    .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}/100`)
    .join("\n");

  const criticalLines = criticalFindings
    .slice(0, 15)
    .map(
      (f) =>
        `  [${f.severity.toUpperCase()}] ${f.title} (${f.module})${f.recommendation ? ` → ${f.recommendation}` : ""}`
    )
    .join("\n");

  const allTitles = allFindingTitles.slice(0, 30).join(", ");

  const system = `You are an AI CTO performing a pre-launch readiness assessment.

Your assessment must:
- Give an honest verdict: "launch-ready" ONLY if there are zero blocking issues
- "not-ready" if ANY of these exist: critical security vulnerabilities, no authentication, no error handling, no HTTPS/TLS configuration, missing legal pages (privacy policy), no production environment config
- Blocking issues = must fix before any real user touches the product
- Advisory issues = should fix but won't cause harm to launch
- Effort estimates must be realistic (not all 1 day)
- The launchScore is independent from SaaS Score — focus purely on launch criteria
- passedChecks should reflect things done well, not things still needed

Categories:
- security: auth, input validation, secrets, HTTPS
- stability: error handling, logging, graceful degradation
- ux: onboarding, empty states, error messages
- legal: privacy policy, terms of service, cookie consent

Scoring guidance:
- 0-40: critical blocking issues present
- 41-65: multiple advisories but fixable
- 66-85: minor gaps, mostly advisory
- 86-100: launch-ready with polish items only`;

  const prompt = `Project: ${projectName}
SaaS Score: ${score}/100

Module scores (weakest first):
${moduleLines}

Critical and high-severity findings:
${criticalLines || "  (none)"}

All finding titles:
${allTitles || "(none)"}

Assess launch readiness. Be honest — "launch-ready" means users can safely use this today.`;

  const { object } = await generateObject({
    model: LAUNCH_MODEL,
    schema: launchOutputSchema,
    system,
    prompt,
  });

  return object;
}
