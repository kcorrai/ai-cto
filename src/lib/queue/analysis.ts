import { after } from "next/server";
import { db } from "@/lib/db";
import { type AnalysisTrigger } from "@prisma/client";
import { checkAnalysisLimit, getModulesForPlan } from "@/lib/billing/limits";
import { processAnalysis } from "@/lib/analysis/processor";
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
  trigger: AnalysisTrigger = "manual"
): Promise<string> {
  await checkAnalysisLimit(userId);

  const acquired = await acquireLock(projectId);
  if (!acquired) {
    throw new AnalysisAlreadyRunningError(projectId);
  }

  let analysisId: string;
  try {
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

    after(() => processAnalysis(payload).catch(console.error));
  } catch (error) {
    await releaseLock(projectId);
    throw error;
  }

  return analysisId;
}
