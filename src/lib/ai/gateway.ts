import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { env } from "@/env";
import type { z } from "zod";

// Routes through Vercel AI Gateway using OpenAI-compatible endpoint
const gateway = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

export const AI_MODEL = gateway("anthropic/claude-sonnet-4-6");

export type GenerationResult<T> = {
  object: T;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
};

export async function generateAnalysis<T>(params: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<GenerationResult<T>> {
  const start = Date.now();
  const { object, usage } = await generateObject({
    model: AI_MODEL,
    schema: params.schema,
    system: params.system,
    prompt: params.prompt,
  });
  return {
    object,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    durationMs: Date.now() - start,
  };
}
