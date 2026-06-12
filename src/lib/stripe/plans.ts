import type { Plan } from "@prisma/client";
import { env } from "@/env";

export type PlanLimits = {
  projects: number;
  analysesPerMonth: number;
  modules: number; // count of modules allowed
  privateRepos: boolean;
  teamMembers: number;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    projects: 1,
    analysesPerMonth: 2,
    modules: 5,
    privateRepos: false,
    teamMembers: 1,
  },
  pro: {
    projects: 5,
    analysesPerMonth: 20,
    modules: 12,
    privateRepos: true,
    teamMembers: 1,
  },
  team: {
    projects: 20,
    analysesPerMonth: Infinity,
    modules: 12,
    privateRepos: true,
    teamMembers: 10,
  },
  enterprise: {
    projects: Infinity,
    analysesPerMonth: Infinity,
    modules: 12,
    privateRepos: true,
    teamMembers: Infinity,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export type BillingInterval = "monthly" | "yearly";

export function getProPriceId(interval: BillingInterval): string {
  const id =
    interval === "yearly" ? env.STRIPE_PRO_YEARLY_PRICE_ID : env.STRIPE_PRO_MONTHLY_PRICE_ID;
  if (!id) throw new Error(`STRIPE_PRO_${interval.toUpperCase()}_PRICE_ID is not set`);
  return id;
}
