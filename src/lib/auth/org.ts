import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export type OrgContext = {
  organizationId: string;
  clerkOrgId: string;
  role: "owner" | "admin" | "editor" | "viewer";
};

export async function getActiveOrg(): Promise<OrgContext | null> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) return null;

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, clerkOrgId: true },
  });

  if (!org) return null;

  const role = mapClerkRole(orgRole ?? "");
  return { organizationId: org.id, clerkOrgId: org.clerkOrgId, role };
}

export function mapClerkRole(clerkRole: string): "owner" | "admin" | "editor" | "viewer" {
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

export type ProjectOwnerFilter =
  | { userId: string; organizationId?: undefined }
  | { organizationId: string; userId?: undefined };

export async function getProjectOwnerFilter(
  dbUserId: string,
  clerkOrgId?: string | null
): Promise<ProjectOwnerFilter> {
  if (!clerkOrgId) return { userId: dbUserId };

  const org = await db.organization.findUnique({
    where: { clerkOrgId, deletedAt: null },
    select: { id: true },
  });

  if (!org) return { userId: dbUserId };
  return { organizationId: org.id };
}
