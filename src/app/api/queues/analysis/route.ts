import { processAnalysis } from "@/lib/analysis/processor";
import type { AnalysisJobPayload } from "@/lib/analysis/shared";
import { env } from "@/env";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { AnalysisFailedEmail } from "@/emails/AnalysisFailedEmail";

export const maxDuration = 300;

const RETRY_DELAYS_MS = [5_000, 15_000, 45_000];
const MAX_RETRIES = 3;

export async function POST(req: Request): Promise<Response> {
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret !== env.ENCRYPTION_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = (await req.json()) as AnalysisJobPayload;

  void (async () => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await db.analysis
          .update({
            where: { id: payload.analysisId },
            data: { status: "queued", retryCount: attempt },
          })
          .catch(() => null);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
      }

      try {
        await processAnalysis(payload);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    // All retries exhausted — persist final retry count and send failure email
    await db.analysis
      .update({
        where: { id: payload.analysisId },
        data: { retryCount: MAX_RETRIES, lastError: lastError?.message ?? "Unknown error" },
      })
      .catch(() => null);

    const user = await db.user
      .findUnique({ where: { id: payload.userId }, select: { email: true, name: true } })
      .catch(() => null);
    if (user) {
      const project = await db.project
        .findUnique({
          where: { id: payload.projectId },
          select: { githubOwner: true, githubRepo: true },
        })
        .catch(() => null);
      const projectName = project ? `${project.githubOwner}/${project.githubRepo}` : "your project";
      void sendEmail({
        to: user.email,
        subject: `Analysis failed for ${projectName}`,
        react: AnalysisFailedEmail({
          name: user.name ?? user.email,
          projectName,
          retryUrl: `${env.NEXT_PUBLIC_APP_URL}/projects/${payload.projectId}/overview`,
        }),
      });
    }
  })();

  return new Response("Accepted", { status: 202 });
}
