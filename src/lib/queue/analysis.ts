import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { type AnalysisTrigger } from "@prisma/client";
import { checkAnalysisLimit, getModulesForPlan } from "@/lib/billing/limits";
import { env } from "@/env";
import {
  acquireLock,
  releaseLock,
  AnalysisAlreadyRunningError,
  type AnalysisJobPayload,
} from "@/lib/analysis/shared";

export { releaseLock, AnalysisAlreadyRunningError, type AnalysisJobPayload };

export async function triggerAnalysis(
  projectId: string,
  userId: string,
  trigger: AnalysisTrigger = "manual",
  moduleOverride?: string[]
): Promise<string> {
  await checkAnalysisLimit(userId);

  const acquired = await acquireLock(projectId);
  if (!acquired) {
    throw new AnalysisAlreadyRunningError(projectId);
  }

  let analysisId: string;
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const planModules = getModulesForPlan(user?.plan ?? "free");
    // Smart diff: intersect override with plan modules so we never run locked modules
    const modules = moduleOverride
      ? (planModules as string[]).filter((m) => moduleOverride.includes(m))
      : (planModules as string[]);

    const analysis = await db.analysis.create({
      data: {
        projectId,
        triggeredById: userId,
        trigger,
        status: "queued",
        progress: 0,
      },
      select: { id: true },
    });
    analysisId = analysis.id;

    const payload: AnalysisJobPayload = {
      analysisId,
      projectId,
      userId,
      modules,
    };

    // POST to the queue route which uses after() to run the analysis in the
    // background after returning 202. We must await this fetch so the HTTP
    // request is fully sent before the server-action context is terminated.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001");

    await fetch(`${baseUrl}/api/queues/analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": env.ENCRYPTION_KEY,
      },
      body: JSON.stringify(payload),
    }).catch((err: unknown) => logger.errorFrom("Failed to queue analysis", err));
  } catch (error) {
    await releaseLock(projectId);
    throw error;
  }

  return analysisId;
}
