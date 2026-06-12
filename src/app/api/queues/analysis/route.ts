import { handleCallback } from "@vercel/queue";
import { processAnalysis } from "@/lib/analysis/processor";
import type { AnalysisJobPayload } from "@/lib/analysis/shared";
import { env } from "@/env";

export const maxDuration = 300;

const queueHandler = handleCallback(processAnalysis, { visibilityTimeoutSeconds: 600 });

export async function POST(req: Request): Promise<Response> {
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret && internalSecret === env.ENCRYPTION_KEY) {
    const payload = (await req.json()) as AnalysisJobPayload;
    processAnalysis(payload).catch(console.error);
    return new Response("Accepted", { status: 202 });
  }
  return queueHandler(req);
}
