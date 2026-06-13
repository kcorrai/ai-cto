import { describe, it, expect } from "vitest";
import { findingSchema } from "./schemas";

const validFinding = {
  severity: "high" as const,
  title: "Missing authentication on admin endpoint",
  description: "The /admin/users endpoint does not require authentication.",
  recommendation: "Add auth middleware to all routes under /admin.",
  effort: "low" as const,
  impact: "high" as const,
};

describe("findingSchema", () => {
  it("accepts a valid finding without filePath", () => {
    expect(() => findingSchema.parse(validFinding)).not.toThrow();
  });

  it("accepts a valid finding with optional filePath", () => {
    expect(() =>
      findingSchema.parse({ ...validFinding, filePath: "src/app/api/admin/route.ts" })
    ).not.toThrow();
  });

  it("parses and returns the correct shape", () => {
    const result = findingSchema.parse(validFinding);
    expect(result.severity).toBe("high");
    expect(result.effort).toBe("low");
    expect(result.impact).toBe("high");
    expect(result.filePath).toBeUndefined();
  });

  describe("severity enum", () => {
    const validSeverities = ["critical", "high", "medium", "low", "info"] as const;

    it.each(validSeverities)("accepts severity: %s", (severity) => {
      expect(() => findingSchema.parse({ ...validFinding, severity })).not.toThrow();
    });

    it("rejects invalid severity", () => {
      expect(() => findingSchema.parse({ ...validFinding, severity: "blocker" })).toThrow();
    });
  });

  describe("effort enum", () => {
    const validEfforts = ["low", "medium", "high"] as const;

    it.each(validEfforts)("accepts effort: %s", (effort) => {
      expect(() => findingSchema.parse({ ...validFinding, effort })).not.toThrow();
    });

    it("rejects invalid effort", () => {
      expect(() => findingSchema.parse({ ...validFinding, effort: "extreme" })).toThrow();
    });
  });

  describe("impact enum", () => {
    const validImpacts = ["low", "medium", "high"] as const;

    it.each(validImpacts)("accepts impact: %s", (impact) => {
      expect(() => findingSchema.parse({ ...validFinding, impact })).not.toThrow();
    });

    it("rejects invalid impact", () => {
      expect(() => findingSchema.parse({ ...validFinding, impact: "critical" })).toThrow();
    });
  });

  describe("required fields", () => {
    it("rejects missing severity", () => {
      const { severity, ...rest } = validFinding;
      expect(() => findingSchema.parse(rest)).toThrow();
    });

    it("rejects missing title", () => {
      const { title, ...rest } = validFinding;
      expect(() => findingSchema.parse(rest)).toThrow();
    });

    it("rejects missing description", () => {
      const { description, ...rest } = validFinding;
      expect(() => findingSchema.parse(rest)).toThrow();
    });

    it("rejects missing recommendation", () => {
      const { recommendation, ...rest } = validFinding;
      expect(() => findingSchema.parse(rest)).toThrow();
    });

    it("rejects missing effort", () => {
      const { effort, ...rest } = validFinding;
      expect(() => findingSchema.parse(rest)).toThrow();
    });

    it("rejects missing impact", () => {
      const { impact, ...rest } = validFinding;
      expect(() => findingSchema.parse(rest)).toThrow();
    });
  });

  it("rejects title longer than 200 characters", () => {
    expect(() => findingSchema.parse({ ...validFinding, title: "x".repeat(201) })).toThrow();
  });

  it("accepts title exactly 200 characters", () => {
    expect(() => findingSchema.parse({ ...validFinding, title: "x".repeat(200) })).not.toThrow();
  });

  it("filePath is optional — omitting it is fine", () => {
    const result = findingSchema.parse(validFinding);
    expect(result.filePath).toBeUndefined();
  });
});
