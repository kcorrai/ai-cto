import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPlanLimits, getModulesForPlan, PlanLimitError } from "./limits";

// Mock DB — async limit checks require it
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    project: { count: vi.fn() },
    analysis: { count: vi.fn() },
  },
}));

describe("getPlanLimits", () => {
  it("free plan — 1 project, 2 analyses, no private repos", () => {
    const limits = getPlanLimits("free");
    expect(limits.maxProjects).toBe(1);
    expect(limits.maxAnalysesPerMonth).toBe(2);
    expect(limits.allowPrivateRepos).toBe(false);
  });

  it("pro plan — 5 projects, 20 analyses, private repos allowed", () => {
    const limits = getPlanLimits("pro");
    expect(limits.maxProjects).toBe(5);
    expect(limits.maxAnalysesPerMonth).toBe(20);
    expect(limits.allowPrivateRepos).toBe(true);
  });

  it("team plan — 20 projects, unlimited analyses, private repos allowed", () => {
    const limits = getPlanLimits("team");
    expect(limits.maxProjects).toBe(20);
    expect(limits.maxAnalysesPerMonth).toBe(Infinity);
    expect(limits.allowPrivateRepos).toBe(true);
  });

  it("enterprise plan — unlimited projects, unlimited analyses, private repos allowed", () => {
    const limits = getPlanLimits("enterprise");
    expect(limits.maxProjects).toBe(Infinity);
    expect(limits.maxAnalysesPerMonth).toBe(Infinity);
    expect(limits.allowPrivateRepos).toBe(true);
  });

  it("free plan project limit is less than pro", () => {
    expect(getPlanLimits("free").maxProjects).toBeLessThan(getPlanLimits("pro").maxProjects);
  });

  it("pro plan analysis limit is less than team", () => {
    expect(getPlanLimits("pro").maxAnalysesPerMonth).toBeLessThan(
      getPlanLimits("team").maxAnalysesPerMonth
    );
  });

  it("only free plan disallows private repos", () => {
    expect(getPlanLimits("free").allowPrivateRepos).toBe(false);
    expect(getPlanLimits("pro").allowPrivateRepos).toBe(true);
    expect(getPlanLimits("team").allowPrivateRepos).toBe(true);
    expect(getPlanLimits("enterprise").allowPrivateRepos).toBe(true);
  });
});

describe("getModulesForPlan", () => {
  const CORE_MODULE_COUNT = 5;
  const ALL_MODULE_COUNT = 16;

  it("free plan returns only core modules (5)", () => {
    const modules = getModulesForPlan("free");
    expect(modules).toHaveLength(CORE_MODULE_COUNT);
  });

  it("free plan includes all Phase-1 core modules", () => {
    const modules = getModulesForPlan("free");
    expect(modules).toContain("architecture");
    expect(modules).toContain("code_quality");
    expect(modules).toContain("security");
    expect(modules).toContain("dependencies");
    expect(modules).toContain("product_readiness");
  });

  it("free plan does not include pro-only modules", () => {
    const modules = getModulesForPlan("free");
    expect(modules).not.toContain("performance");
    expect(modules).not.toContain("testing");
    expect(modules).not.toContain("saas_maturity");
  });

  it("pro plan returns all modules (16)", () => {
    expect(getModulesForPlan("pro")).toHaveLength(ALL_MODULE_COUNT);
  });

  it("team plan returns all modules (16)", () => {
    expect(getModulesForPlan("team")).toHaveLength(ALL_MODULE_COUNT);
  });

  it("enterprise plan returns all modules (16)", () => {
    expect(getModulesForPlan("enterprise")).toHaveLength(ALL_MODULE_COUNT);
  });

  it("paid plans include advanced modules", () => {
    const modules = getModulesForPlan("pro");
    expect(modules).toContain("performance");
    expect(modules).toContain("testing");
    expect(modules).toContain("documentation");
    expect(modules).toContain("api_design");
    expect(modules).toContain("database");
    expect(modules).toContain("devops");
    expect(modules).toContain("saas_maturity");
    expect(modules).toContain("product_manager");
    expect(modules).toContain("market_intelligence");
    expect(modules).toContain("team_advisor");
    expect(modules).toContain("security_owasp");
  });
});

describe("PlanLimitError", () => {
  it("has correct name", () => {
    const err = new PlanLimitError("project_limit", "too many projects");
    expect(err.name).toBe("PlanLimitError");
  });

  it("stores reason and message", () => {
    const err = new PlanLimitError("analysis_limit", "limit exceeded");
    expect(err.reason).toBe("analysis_limit");
    expect(err.message).toBe("limit exceeded");
  });

  it("is an instance of Error", () => {
    const err = new PlanLimitError("private_repo", "no private repos");
    expect(err).toBeInstanceOf(Error);
  });

  it("supports all reason types", () => {
    expect(new PlanLimitError("project_limit", "").reason).toBe("project_limit");
    expect(new PlanLimitError("analysis_limit", "").reason).toBe("analysis_limit");
    expect(new PlanLimitError("private_repo", "").reason).toBe("private_repo");
  });
});

describe("checkProjectLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns early when user not found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const { checkProjectLimit } = await import("./limits");
    await expect(checkProjectLimit("user-1")).resolves.toBeUndefined();
  });

  it("returns early when plan has unlimited projects", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "enterprise" } as never);
    const { checkProjectLimit } = await import("./limits");
    await expect(checkProjectLimit("user-1")).resolves.toBeUndefined();
    expect(db.project.count).not.toHaveBeenCalled();
  });

  it("throws PlanLimitError when free user hits project limit", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "free" } as never);
    vi.mocked(db.project.count).mockResolvedValue(1);
    const { checkProjectLimit } = await import("./limits");
    await expect(checkProjectLimit("user-1")).rejects.toThrow(PlanLimitError);
  });

  it("does not throw when under the project limit", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "free" } as never);
    vi.mocked(db.project.count).mockResolvedValue(0);
    const { checkProjectLimit } = await import("./limits");
    await expect(checkProjectLimit("user-1")).resolves.toBeUndefined();
  });
});

describe("checkAnalysisLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns early when user not found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const { checkAnalysisLimit } = await import("./limits");
    await expect(checkAnalysisLimit("user-1")).resolves.toBeUndefined();
  });

  it("returns early when plan has unlimited analyses", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "team" } as never);
    const { checkAnalysisLimit } = await import("./limits");
    await expect(checkAnalysisLimit("user-1")).resolves.toBeUndefined();
    expect(db.analysis.count).not.toHaveBeenCalled();
  });

  it("throws PlanLimitError when free user hits analysis limit", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "free" } as never);
    vi.mocked(db.analysis.count).mockResolvedValue(2);
    const { checkAnalysisLimit } = await import("./limits");
    await expect(checkAnalysisLimit("user-1")).rejects.toThrow(PlanLimitError);
  });
});

describe("checkPrivateRepoAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns early when user not found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const { checkPrivateRepoAccess } = await import("./limits");
    await expect(checkPrivateRepoAccess("user-1")).resolves.toBeUndefined();
  });

  it("throws PlanLimitError for free plan", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "free" } as never);
    const { checkPrivateRepoAccess } = await import("./limits");
    await expect(checkPrivateRepoAccess("user-1")).rejects.toThrow(PlanLimitError);
  });

  it("does not throw for pro plan", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "pro" } as never);
    const { checkPrivateRepoAccess } = await import("./limits");
    await expect(checkPrivateRepoAccess("user-1")).resolves.toBeUndefined();
  });
});
