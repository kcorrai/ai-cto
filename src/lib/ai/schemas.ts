import { z } from "zod";

export const findingSchema = z.object({
  severity: z
    .enum(["critical", "high", "medium", "low", "info"])
    .describe("Severity of the finding"),
  title: z.string().max(200).describe("Concise title, max 200 characters"),
  description: z.string().describe("Detailed explanation of the issue"),
  recommendation: z.string().describe("Specific, actionable fix with a concrete step"),
  filePath: z
    .string()
    .optional()
    .describe("Exact path from the provided file list — omit if no specific file"),
  effort: z.enum(["low", "medium", "high"]).describe("Effort required to fix"),
  impact: z.enum(["low", "medium", "high"]).describe("Impact of addressing this finding"),
});

export type Finding = z.infer<typeof findingSchema>;
