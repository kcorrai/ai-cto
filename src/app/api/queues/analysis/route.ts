import { after } from "next/server";
import { processAnalysis } from "@/lib/analysis/processor";
import type { AnalysisJobPayload } from "@/lib/analysis/shared";
import { env } from "@/env";

export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret === env.ENCRYPTION_KEY) {
    const payload = (await req.json()) as AnalysisJobPayload;
    after(() => processAnalysis(payload).catch(console.error));
    return new Response("Accepted", { status: 202 });
  }
  return new Response("Unauthorized", { status: 401 });
}
