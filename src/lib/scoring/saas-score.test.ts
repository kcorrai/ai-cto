import { describe, it, expect } from "vitest";
import { calculateSaaSScore, getLabel, MODULE_WEIGHTS } from "./saas-score";

describe("getLabel", () => {
  it("returns Pre-Alpha for 0–34", () => {
    expect(getLabel(0)).toBe("Pre-Alpha");
    expect(getLabel(34)).toBe("Pre-Alpha");
  });
  it("returns Early Stage for 35–49", () => {
    expect(getLabel(35)).toBe("Early Stage");
    expect(getLabel(49)).toBe("Early Stage");
  });
  it("returns Needs Work for 50–64", () => {
    expect(getLabel(50)).toBe("Needs Work");
    expect(getLabel(64)).toBe("Needs Work");
  });
  it("returns Nearly There for 65–79", () => {
    expect(getLabel(65)).toBe("Nearly There");
    expect(getLabel(79)).toBe("Nearly There");
  });
  it("returns Launch-Ready for 80–100", () => {
    expect(getLabel(80)).toBe("Launch-Ready");
    expect(getLabel(100)).toBe("Launch-Ready");
  });
});

describe("calculateSaaSScore", () => {
  it("returns score 0 and Pre-Alpha for empty input", () => {
    const result = calculateSaaSScore({});
    expect(result.score).toBe(0);
    expect(result.label).toBe("Pre-Alpha");
    expect(result.breakdown).toEqual({});
  });

  it("single module — score equals that module score", () => {
    // With only security (weight 0.18), normalized weight = 1.0 so score = module score
    const result = calculateSaaSScore({ security: 72 });
    expect(result.score).toBe(72);
    expect(result.label).toBe("Nearly There");
    expect(result.breakdown.security).toBe(72);
  });

  it("full set of all 12 modules at same score → composite equals that score", () => {
    const allSame = Object.fromEntries(
      Object.keys(MODULE_WEIGHTS).map((k) => [k, 70])
    ) as Parameters<typeof calculateSaaSScore>[0];
    const result = calculateSaaSScore(allSame);
    expect(result.score).toBe(70);
  });

  it("partial set (Phase 1 modules only) — does not penalize for missing modules", () => {
    // All 5 Phase-1 modules at 80 → should score 80, not lower
    const result = calculateSaaSScore({
      architecture: 80,
      code_quality: 80,
      security: 80,
      dependencies: 80,
      product_readiness: 80,
    });
    expect(result.score).toBe(80);
    expect(result.label).toBe("Launch-Ready");
  });

  it("boundary values produce correct labels", () => {
    const cases: [number, string][] = [
      [0, "Pre-Alpha"],
      [34, "Pre-Alpha"],
      [35, "Early Stage"],
      [49, "Early Stage"],
      [50, "Needs Work"],
      [64, "Needs Work"],
      [65, "Nearly There"],
      [79, "Nearly There"],
      [80, "Launch-Ready"],
      [100, "Launch-Ready"],
    ];
    for (const [score, label] of cases) {
      expect(getLabel(score), `score ${score}`).toBe(label);
    }
  });

  it("clamps out-of-range module scores to 0–100", () => {
    const result = calculateSaaSScore({ architecture: 150, code_quality: -10 });
    expect(result.breakdown.architecture).toBe(100);
    expect(result.breakdown.code_quality).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("score is always an integer", () => {
    const result = calculateSaaSScore({ architecture: 71, security: 83 });
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it("mixed module scores produce weighted composite", () => {
    // security(0.18)=100 + architecture(0.15)=0 → totalWeight=0.33
    // weightedSum = 0.18*100 + 0.15*0 = 18 → 18/0.33 ≈ 54.5 → rounds to 55
    const result = calculateSaaSScore({ security: 100, architecture: 0 });
    expect(result.score).toBe(55);
    expect(result.label).toBe("Needs Work");
  });
});
