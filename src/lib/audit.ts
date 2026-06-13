import { db } from "@/lib/db";
import { headers } from "next/headers";

type AuditEventInput = {
  userId: string;
  organizationId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
};

export async function logAuditEvent(input: AuditEventInput) {
  try {
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (input.req) {
      ipAddress =
        input.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        input.req.headers.get("x-real-ip") ??
        undefined;
      userAgent = input.req.headers.get("user-agent") ?? undefined;
    } else {
      try {
        const hdrs = await headers();
        ipAddress =
          hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? undefined;
        userAgent = hdrs.get("user-agent") ?? undefined;
      } catch {
        // headers() may not be available outside request context
      }
    }

    await db.auditLog.create({
      data: {
        userId: input.userId,
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        action: input.action,
        ...(input.resource ? { resource: input.resource } : {}),
        ...(input.resourceId ? { resourceId: input.resourceId } : {}),
        ...(input.resourceName ? { resourceName: input.resourceName } : {}),
        metadata: (input.metadata ?? {}) as Record<string, string>,
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {}),
      },
    });
  } catch {
    // Audit log failures should never break the main flow
  }
}

export const AuditAction = {
  // Auth
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  // Projects
  PROJECT_CREATED: "project.created",
  PROJECT_DELETED: "project.deleted",
  PROJECT_ANALYZED: "project.analyzed",
  // SSO
  SSO_CONNECTION_CREATED: "sso.connection.created",
  SSO_CONNECTION_DELETED: "sso.connection.deleted",
  SSO_CONNECTION_UPDATED: "sso.connection.updated",
  // SCIM
  SCIM_TOKEN_GENERATED: "scim.token.generated",
  SCIM_TOKEN_REVOKED: "scim.token.revoked",
  SCIM_USER_PROVISIONED: "scim.user.provisioned",
  SCIM_USER_DEPROVISIONED: "scim.user.deprovisioned",
  // Members
  MEMBER_INVITED: "member.invited",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  // API keys
  API_KEY_CREATED: "api_key.created",
  API_KEY_DELETED: "api_key.deleted",
  // Reports
  REPORT_EXPORTED: "report.exported",
  REPORT_SHARED: "report.shared",
  // Billing
  SUBSCRIPTION_CHANGED: "subscription.changed",
  // Settings
  ORG_SETTINGS_UPDATED: "org.settings_updated",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];
