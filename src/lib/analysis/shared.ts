import { redis } from "@/lib/redis";

const LOCK_TTL_SECONDS = 600;

export type AnalysisJobPayload = {
  analysisId: string;
  projectId: string;
  userId: string;
  modules: string[];
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

export async function acquireLock(projectId: string): Promise<boolean> {
  const result = await redis.set(lockKey(projectId), "1", { nx: true, ex: LOCK_TTL_SECONDS });
  return result !== null;
}

export async function releaseLock(projectId: string): Promise<void> {
  await redis.del(lockKey(projectId));
}
