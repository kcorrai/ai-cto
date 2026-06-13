import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPromptVariant, buildVariantTag } from "./ab-testing";

describe("getPromptVariant", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // restore env after each test
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("PROMPT_VARIANT_")) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it("returns v1 when env var is not set", () => {
    delete process.env.PROMPT_VARIANT_SECURITY;
    expect(getPromptVariant("security")).toBe("v1");
  });

  it("returns v2 when env var is set to v2", () => {
    process.env.PROMPT_VARIANT_SECURITY = "v2";
    expect(getPromptVariant("security")).toBe("v2");
  });

  it("returns v1 when env var is set to an invalid value", () => {
    process.env.PROMPT_VARIANT_SECURITY = "v3";
    expect(getPromptVariant("security")).toBe("v1");
  });

  it("returns v1 for unknown module (no env key mapping)", () => {
    expect(getPromptVariant("nonexistent_module")).toBe("v1");
  });

  it("maps correct env key for each known module", () => {
    const cases: [string, string][] = [
      ["architecture", "PROMPT_VARIANT_ARCHITECTURE"],
      ["code_quality", "PROMPT_VARIANT_CODE_QUALITY"],
      ["performance", "PROMPT_VARIANT_PERFORMANCE"],
      ["testing", "PROMPT_VARIANT_TESTING"],
      ["documentation", "PROMPT_VARIANT_DOCUMENTATION"],
      ["api_design", "PROMPT_VARIANT_API_DESIGN"],
      ["database", "PROMPT_VARIANT_DATABASE"],
      ["devops", "PROMPT_VARIANT_DEVOPS"],
      ["saas_maturity", "PROMPT_VARIANT_SAAS_MATURITY"],
      ["dependencies", "PROMPT_VARIANT_DEPENDENCIES"],
      ["product_readiness", "PROMPT_VARIANT_PRODUCT_READINESS"],
    ];
    for (const [module, envKey] of cases) {
      process.env[envKey] = "v2";
      expect(getPromptVariant(module), module).toBe("v2");
      delete process.env[envKey];
    }
  });
});

describe("buildVariantTag", () => {
  it("produces module:variant format", () => {
    expect(buildVariantTag("security", "v1")).toBe("security:v1");
    expect(buildVariantTag("security", "v2")).toBe("security:v2");
  });

  it("works for any module name", () => {
    expect(buildVariantTag("code_quality", "v1")).toBe("code_quality:v1");
    expect(buildVariantTag("api_design", "v2")).toBe("api_design:v2");
  });
});
