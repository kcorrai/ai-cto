// Prompt A/B testing framework.
// To add a new variant: add to PROMPT_VARIANTS and implement buildXxxSystemPrompt_v2 in the prompt file.
// Variant is selected per-module at analysis time via PROMPT_VARIANT_<MODULE> env var (e.g., PROMPT_VARIANT_SECURITY=v2).
// If env var is unset or invalid, falls back to "v1".

export type PromptVariant = "v1" | "v2";

const MODULE_VARIANT_KEYS: Record<string, string> = {
  architecture: "PROMPT_VARIANT_ARCHITECTURE",
  code_quality: "PROMPT_VARIANT_CODE_QUALITY",
  security: "PROMPT_VARIANT_SECURITY",
  performance: "PROMPT_VARIANT_PERFORMANCE",
  testing: "PROMPT_VARIANT_TESTING",
  documentation: "PROMPT_VARIANT_DOCUMENTATION",
  api_design: "PROMPT_VARIANT_API_DESIGN",
  database: "PROMPT_VARIANT_DATABASE",
  devops: "PROMPT_VARIANT_DEVOPS",
  saas_maturity: "PROMPT_VARIANT_SAAS_MATURITY",
  dependencies: "PROMPT_VARIANT_DEPENDENCIES",
  product_readiness: "PROMPT_VARIANT_PRODUCT_READINESS",
  product_manager: "PROMPT_VARIANT_PRODUCT_MANAGER",
  market_intelligence: "PROMPT_VARIANT_MARKET_INTELLIGENCE",
};

export function getPromptVariant(module: string): PromptVariant {
  const envKey = MODULE_VARIANT_KEYS[module];
  if (!envKey) return "v1";
  const value = process.env[envKey];
  if (value === "v2") return "v2";
  return "v1";
}

export function buildVariantTag(module: string, variant: PromptVariant): string {
  return `${module}:${variant}`;
}
