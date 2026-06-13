import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export type Permission =
  | "project:create"
  | "project:delete"
  | "analysis:trigger"
  | "member:invite"
  | "member:remove"
  | "member:change_role"
  | "billing:manage"
  | "org:settings"
  | "org:delete"
  | "finding:resolve"
  | "finding:comment"
  | "report:export";

type OrgRole = "owner" | "admin" | "editor" | "viewer";

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
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
  ],
  admin: [
    "project:create",
    "project:delete",
    "analysis:trigger",
    "member:invite",
    "member:remove",
    "member:change_role",
    "org:settings",
    "finding:resolve",
    "finding:comment",
    "report:export",
  ],
  editor: [
    "project:create",
    "analysis:trigger",
    "finding:resolve",
    "finding:comment",
    "report:export",
  ],
  viewer: ["finding:comment", "report:export"],
};

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function mapClerkRoleToOrgRole(clerkRole: string): OrgRole {
  switch (clerkRole) {
    case "org:owner":
      return "owner";
    case "org:admin":
      return "admin";
    case "org:member":
      return "editor";
    default:
      return "viewer";
  }
}

export async function checkOrgPermission(permission: Permission): Promise<boolean> {
  const { orgRole } = await auth();
  if (!orgRole) return false;
  const role = mapClerkRoleToOrgRole(orgRole);
  return hasPermission(role, permission);
}

export async function requireOrgPermission(permission: Permission): Promise<void> {
  const allowed = await checkOrgPermission(permission);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}

export async function getDbUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  return user?.id ?? null;
}
