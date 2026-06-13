import type { ModuleName, Plan } from "@prisma/client";
import { db } from "@/lib/db";

// Phase 1 modules — available to all plans
const CORE_MODULES: ModuleName[] = [
  "architecture",
  "code_quality",
  "security",
  "dependencies",
  "product_readiness",
];

// All 12 modules — unlocked with Pro+
const ALL_MODULES: ModuleName[] = [
  "architecture",
  "code_quality",
  "security",
  "performance",
  "testing",
  "documentation",
  "dependencies",
  "api_design",
  "database",
  "devops",
  "product_readiness",
  "saas_maturity",
  "product_manager",
  "market_intelligence",
  "team_advisor",
  "security_owasp",
];

type PlanLimits = {
  maxProjects: number;
  maxAnalysesPerMonth: number;
  allowPrivateRepos: boolean;
};

const LIMITS: Record<Plan, PlanLimits> = {
  free: { maxProjects: 1, maxAnalysesPerMonth: 2, allowPrivateRepos: false },
  pro: { maxProjects: 5, maxAnalysesPerMonth: 20, allowPrivateRepos: true },
  team: { maxProjects: 20, maxAnalysesPerMonth: Infinity, allowPrivateRepos: true },
  enterprise: { maxProjects: Infinity, maxAnalysesPerMonth: Infinity, allowPrivateRepos: true },
};

export class PlanLimitError extends Error {
  constructor(
    public readonly reason: "project_limit" | "analysis_limit" | "private_repo",
    message: string
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return LIMITS[plan];
}

export function getModulesForPlan(plan: Plan): ModuleName[] {
  if (plan === "free") return CORE_MODULES;
  return ALL_MODULES;
}

export async function checkProjectLimit(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) return;

  const limits = getPlanLimits(user.plan);
  if (limits.maxProjects === Infinity) return;

  const count = await db.project.count({
    where: { userId, status: { not: "deleted" } },
  });

  if (count >= limits.maxProjects) {
    throw new PlanLimitError(
      "project_limit",
      `Free plan allows ${limits.maxProjects} project. Upgrade to Pro for more.`
    );
  }
}

export async function checkAnalysisLimit(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) return;

  const limits = getPlanLimits(user.plan);
  if (limits.maxAnalysesPerMonth === Infinity) return;

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const count = await db.analysis.count({
    where: {
      triggeredById: userId,
      createdAt: { gte: start },
      status: { not: "failed" },
    },
  });

  if (count >= limits.maxAnalysesPerMonth) {
    throw new PlanLimitError(
      "analysis_limit",
      `Free plan allows ${limits.maxAnalysesPerMonth} analyses per month. Upgrade to Pro for more.`
    );
  }
}

export async function checkPrivateRepoAccess(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) return;

  const limits = getPlanLimits(user.plan);
  if (!limits.allowPrivateRepos) {
    throw new PlanLimitError(
      "private_repo",
      "Private repos require a Pro plan. Upgrade to analyze private repositories."
    );
  }
}
