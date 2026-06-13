import { describe, it, expect } from "vitest";
import { hasPermission, mapClerkRoleToOrgRole, type Permission } from "./permissions";

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
