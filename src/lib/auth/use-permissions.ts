"use client";

import { useOrganization } from "@clerk/nextjs";
import { hasPermission, mapClerkRoleToOrgRole, type Permission } from "./permissions";

export function usePermissions() {
  const { membership } = useOrganization();

  const clerkRole = membership?.role ?? "";
  const role = mapClerkRoleToOrgRole(clerkRole);

  function can(permission: Permission): boolean {
    if (!membership) return false;
    return hasPermission(role, permission);
  }

  return { can, role };
}
