import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { send } from "@vercel/queue";
import { type AnalysisTrigger } from "@prisma/client";
import { checkAnalysisLimit, getModulesForPlan } from "@/lib/billing/limits";

const LOCK_TTL_SECONDS = 600; // 10 minutes — matches visibilityTimeoutSeconds in consumer

export type AnalysisJobPayload = {
  analysisId: string;
  projectId: string;
  userId: string;
  modules: string[]; // ModuleName values as strings for JSON serialization
};

export class AnalysisAlreadyRunningError extends Error {
  constructor(projectId: string) {
    super(`Analysis already running for project ${projectId}`);
    this.name = "AnalysisAlreadyRunningError";
  }
}

export function lockKey(projectId: string): string {
  return `analysis:lock:${projectId}`;
}

export async function releaseLock(projectId: string): Promise<void> {
  await redis.del(lockKey(projectId));
}

export async function triggerAnalysis(
  projectId: string,
  userId: string,
  trigger: AnalysisTrigger = "manual"
): Promise<string> {
  // Enforce per-month analysis limit before acquiring lock
  await checkAnalysisLimit(userId);

  const key = lockKey(projectId);

  // NX = set only if key doesn't exist; returns "OK" on success, null if already locked
  const acquired = await redis.set(key, "1", { nx: true, ex: LOCK_TTL_SECONDS });
  if (!acquired) {
    throw new AnalysisAlreadyRunningError(projectId);
  }

  let analysisId: string;
  try {
    // Determine which modules this user's plan unlocks
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const modules = getModulesForPlan(user?.plan ?? "free");

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
      modules: modules as string[],
    };
    await send("analysis-jobs", payload, { idempotencyKey: analysisId });
  } catch (error) {
    await releaseLock(projectId);
    throw error;
  }

  return analysisId;
}
