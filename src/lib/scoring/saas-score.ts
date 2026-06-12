import type { ModuleName } from "@prisma/client";

// Weights from docs/ai-system-design.md — must sum to 1.0
export const MODULE_WEIGHTS: Record<ModuleName, number> = {
  architecture: 0.15,
  code_quality: 0.12,
  security: 0.18,
  performance: 0.08,
  testing: 0.1,
  documentation: 0.05,
  dependencies: 0.07,
  api_design: 0.05,
  database: 0.08,
  devops: 0.07,
  product_readiness: 0.08,
  saas_maturity: 0.1,
};

export type SaaSScoreLabel =
  | "Pre-Alpha"
  | "Early Stage"
  | "Needs Work"
  | "Nearly There"
  | "Launch-Ready";

export type SaaSScoreResult = {
  score: number;
  label: SaaSScoreLabel;
  breakdown: Partial<Record<ModuleName, number>>;
};

export function getLabel(score: number): SaaSScoreLabel {
  if (score >= 80) return "Launch-Ready";
  if (score >= 65) return "Nearly There";
  if (score >= 50) return "Needs Work";
  if (score >= 35) return "Early Stage";
  return "Pre-Alpha";
}

export function calculateSaaSScore(
  moduleScores: Partial<Record<ModuleName, number>>
): SaaSScoreResult {
  const entries = Object.entries(moduleScores) as [ModuleName, number][];

  // 0 modules → score 0
  if (entries.length === 0) {
    return { score: 0, label: "Pre-Alpha", breakdown: {} };
  }

  // Normalize weights to the subset of provided modules so missing modules
  // don't drag the score down (don't penalize for locked/future modules)
  const totalWeight = entries.reduce((sum, [mod]) => sum + MODULE_WEIGHTS[mod], 0);
  const weightedSum = entries.reduce(
    (sum, [mod, s]) => sum + MODULE_WEIGHTS[mod] * Math.max(0, Math.min(100, s)),
    0
  );

  const raw = weightedSum / totalWeight;
  const score = Math.round(raw);

  const breakdown: Partial<Record<ModuleName, number>> = {};
  for (const [mod, s] of entries) {
    breakdown[mod] = Math.max(0, Math.min(100, s));
  }

  return { score, label: getLabel(score), breakdown };
}
