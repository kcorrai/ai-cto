import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasPermission, mapClerkRoleToOrgRole, type Permission } from "./permissions";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
  },
}));

const ALL_PERMISSIONS: Permission[] = [
  "project:create",
  "project:delete",
  "analysis:trigger",
  "member:invite",
  "member:remove",
  "member:change_role",
  "billing:manage",
  "org:settings",
  "org:delete",
  "finding:resolve",
  "finding:comment",
  "report:export",
];

describe("hasPermission", () => {
  describe("owner role", () => {
    it("has all permissions", () => {
      for (const permission of ALL_PERMISSIONS) {
        expect(hasPermission("owner", permission), permission).toBe(true);
      }
    });
  });

  describe("admin role", () => {
    it("can create/delete projects and trigger analyses", () => {
      expect(hasPermission("admin", "project:create")).toBe(true);
      expect(hasPermission("admin", "project:delete")).toBe(true);
      expect(hasPermission("admin", "analysis:trigger")).toBe(true);
    });

    it("can manage members and org settings", () => {
      expect(hasPermission("admin", "member:invite")).toBe(true);
      expect(hasPermission("admin", "member:remove")).toBe(true);
      expect(hasPermission("admin", "member:change_role")).toBe(true);
      expect(hasPermission("admin", "org:settings")).toBe(true);
    });

    it("cannot manage billing or delete the org", () => {
      expect(hasPermission("admin", "billing:manage")).toBe(false);
      expect(hasPermission("admin", "org:delete")).toBe(false);
    });

    it("can resolve findings and export reports", () => {
      expect(hasPermission("admin", "finding:resolve")).toBe(true);
      expect(hasPermission("admin", "finding:comment")).toBe(true);
      expect(hasPermission("admin", "report:export")).toBe(true);
    });
  });

  describe("editor role", () => {
    it("can create projects and trigger analyses", () => {
      expect(hasPermission("editor", "project:create")).toBe(true);
      expect(hasPermission("editor", "analysis:trigger")).toBe(true);
    });

    it("cannot delete projects", () => {
      expect(hasPermission("editor", "project:delete")).toBe(false);
    });

    it("cannot manage members, billing, or org", () => {
      expect(hasPermission("editor", "member:invite")).toBe(false);
      expect(hasPermission("editor", "member:remove")).toBe(false);
      expect(hasPermission("editor", "member:change_role")).toBe(false);
      expect(hasPermission("editor", "billing:manage")).toBe(false);
      expect(hasPermission("editor", "org:settings")).toBe(false);
      expect(hasPermission("editor", "org:delete")).toBe(false);
    });

    it("can resolve findings and export reports", () => {
      expect(hasPermission("editor", "finding:resolve")).toBe(true);
      expect(hasPermission("editor", "finding:comment")).toBe(true);
      expect(hasPermission("editor", "report:export")).toBe(true);
    });
  });

  describe("viewer role", () => {
    it("can only comment on findings and export reports", () => {
      expect(hasPermission("viewer", "finding:comment")).toBe(true);
      expect(hasPermission("viewer", "report:export")).toBe(true);
    });

    it("cannot do anything else", () => {
      const restricted: Permission[] = [
        "project:create",
        "project:delete",
        "analysis:trigger",
        "member:invite",
        "member:remove",
        "member:change_role",
        "billing:manage",
        "org:settings",
        "org:delete",
        "finding:resolve",
      ];
      for (const permission of restricted) {
        expect(hasPermission("viewer", permission), permission).toBe(false);
      }
    });
  });

  it("only owner can delete org", () => {
    expect(hasPermission("owner", "org:delete")).toBe(true);
    expect(hasPermission("admin", "org:delete")).toBe(false);
    expect(hasPermission("editor", "org:delete")).toBe(false);
    expect(hasPermission("viewer", "org:delete")).toBe(false);
  });

  it("only owner can manage billing", () => {
    expect(hasPermission("owner", "billing:manage")).toBe(true);
    expect(hasPermission("admin", "billing:manage")).toBe(false);
    expect(hasPermission("editor", "billing:manage")).toBe(false);
    expect(hasPermission("viewer", "billing:manage")).toBe(false);
  });
});

describe("mapClerkRoleToOrgRole", () => {
  it("maps org:owner to owner", () => {
    expect(mapClerkRoleToOrgRole("org:owner")).toBe("owner");
  });

  it("maps org:admin to admin", () => {
    expect(mapClerkRoleToOrgRole("org:admin")).toBe("admin");
  });

  it("maps org:member to editor", () => {
    expect(mapClerkRoleToOrgRole("org:member")).toBe("editor");
  });

  it("unknown role falls back to viewer", () => {
    expect(mapClerkRoleToOrgRole("")).toBe("viewer");
    expect(mapClerkRoleToOrgRole("unknown")).toBe("viewer");
    expect(mapClerkRoleToOrgRole("org:guest")).toBe("viewer");
    expect(mapClerkRoleToOrgRole("OWNER")).toBe("viewer");
  });
});

describe("checkOrgPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when no orgRole", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ orgRole: null } as never);
    const { checkOrgPermission } = await import("./permissions");
    const result = await checkOrgPermission("project:create");
    expect(result).toBe(false);
  });

  it("returns true for owner with any permission", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ orgRole: "org:owner" } as never);
    const { checkOrgPermission } = await import("./permissions");
    expect(await checkOrgPermission("billing:manage")).toBe(true);
    expect(await checkOrgPermission("org:delete")).toBe(true);
  });

  it("returns false for viewer with restricted permission", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ orgRole: "org:member_viewer" } as never);
    const { checkOrgPermission } = await import("./permissions");
    expect(await checkOrgPermission("project:create")).toBe(false);
  });
});

describe("requireOrgPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when permission is denied", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ orgRole: null } as never);
    const { requireOrgPermission } = await import("./permissions");
    await expect(requireOrgPermission("org:delete")).rejects.toThrow("Forbidden");
  });

  it("does not throw when permission is granted", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ orgRole: "org:owner" } as never);
    const { requireOrgPermission } = await import("./permissions");
    await expect(requireOrgPermission("billing:manage")).resolves.toBeUndefined();
  });
});

describe("getDbUserId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const { getDbUserId } = await import("./permissions");
    expect(await getDbUserId()).toBeNull();
  });

  it("returns db user id when authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: "clerk-1" } as never);
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "db-user-1" } as never);
    const { getDbUserId } = await import("./permissions");
    expect(await getDbUserId()).toBe("db-user-1");
  });

  it("returns null when db user not found", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValue({ userId: "clerk-1" } as never);
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const { getDbUserId } = await import("./permissions");
    expect(await getDbUserId()).toBeNull();
  });
});
