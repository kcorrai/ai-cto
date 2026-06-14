import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapClerkRole, getProjectOwnerFilter } from "./org";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

describe("mapClerkRole", () => {
  it("maps org:owner to owner", () => {
    expect(mapClerkRole("org:owner")).toBe("owner");
  });

  it("maps org:admin to admin", () => {
    expect(mapClerkRole("org:admin")).toBe("admin");
  });

  it("maps org:member to editor", () => {
    expect(mapClerkRole("org:member")).toBe("editor");
  });

  it("empty string falls back to viewer", () => {
    expect(mapClerkRole("")).toBe("viewer");
  });

  it("unknown role falls back to viewer", () => {
    expect(mapClerkRole("org:guest")).toBe("viewer");
    expect(mapClerkRole("unknown")).toBe("viewer");
    expect(mapClerkRole("OWNER")).toBe("viewer");
    expect(mapClerkRole("org:moderator")).toBe("viewer");
  });
});

describe("getProjectOwnerFilter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns userId filter when no clerkOrgId", async () => {
    const result = await getProjectOwnerFilter("db-user-1");
    expect(result).toEqual({ userId: "db-user-1" });
  });

  it("returns userId filter when clerkOrgId is null", async () => {
    const result = await getProjectOwnerFilter("db-user-1", null);
    expect(result).toEqual({ userId: "db-user-1" });
  });

  it("returns organizationId filter when org found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.organization.findUnique).mockResolvedValue({ id: "org-db-id" } as never);
    const result = await getProjectOwnerFilter("db-user-1", "clerk-org-id");
    expect(result).toEqual({ organizationId: "org-db-id" });
  });

  it("falls back to userId when org not found in DB", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.organization.findUnique).mockResolvedValue(null);
    const result = await getProjectOwnerFilter("db-user-1", "nonexistent-org");
    expect(result).toEqual({ userId: "db-user-1" });
  });
});

describe("getActiveOrg", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no userId", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null } as never);
    const { getActiveOrg } = await import("./org");
    const result = await getActiveOrg();
    expect(result).toBeNull();
  });

  it("returns null when no orgId", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: "user-1", orgId: null } as never);
    const { getActiveOrg } = await import("./org");
    const result = await getActiveOrg();
    expect(result).toBeNull();
  });

  it("returns null when org not in DB", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgRole: "org:admin",
    } as never);
    const { db } = await import("@/lib/db");
    vi.mocked(db.organization.findUnique).mockResolvedValue(null);
    const { getActiveOrg } = await import("./org");
    const result = await getActiveOrg();
    expect(result).toBeNull();
  });

  it("returns OrgContext when everything is found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({
      userId: "user-1",
      orgId: "clerk-org-1",
      orgRole: "org:admin",
    } as never);
    const { db } = await import("@/lib/db");
    vi.mocked(db.organization.findUnique).mockResolvedValue({
      id: "db-org-1",
      clerkOrgId: "clerk-org-1",
    } as never);
    const { getActiveOrg } = await import("./org");
    const result = await getActiveOrg();
    expect(result).toEqual({
      organizationId: "db-org-1",
      clerkOrgId: "clerk-org-1",
      role: "admin",
    });
  });
});
