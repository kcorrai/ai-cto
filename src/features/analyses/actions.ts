"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { triggerAnalysis, AnalysisAlreadyRunningError } from "@/lib/queue/analysis";
import { PlanLimitError } from "@/lib/billing/limits";

export type RetriggerResult =
  | { ok: true; analysisId: string }
  | {
      ok: false;
      error: "unauthorized" | "project_not_found" | "already_running" | "plan_limit" | "unknown";
    };

export async function retriggerAnalysis(projectId: string): Promise<RetriggerResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { ok: false, error: "unauthorized" };

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "unauthorized" };

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id, status: { not: "deleted" } },
    select: { id: true },
  });
  if (!project) return { ok: false, error: "project_not_found" };

  try {
    const analysisId = await triggerAnalysis(projectId, user.id);
    return { ok: true, analysisId };
  } catch (err) {
    if (err instanceof AnalysisAlreadyRunningError) return { ok: false, error: "already_running" };
    if (err instanceof PlanLimitError) return { ok: false, error: "plan_limit" };
    return { ok: false, error: "unknown" };
  }
}
