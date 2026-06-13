import { auth, clerkClient } from "@clerk/nextjs/server";
import { checkOrgPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { logAuditEvent, AuditAction } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId, orgId } = await auth();
  if (!orgId || !clerkId) return new Response("Unauthorized", { status: 401 });

  const allowed = await checkOrgPermission("member:change_role");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = (await req.json()) as { role: string };
  const { role } = body;

  const validRoles = ["org:admin", "org:member"];
  if (!validRoles.includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.organizations.updateOrganizationMembership({
      organizationId: orgId,
      userId: id,
      role,
    });

    const [actor, org] = await Promise.all([
      db.user.findUnique({ where: { clerkId }, select: { id: true } }),
      db.organization.findUnique({ where: { clerkOrgId: orgId }, select: { id: true } }),
    ]);
    if (actor && org) {
      void logAuditEvent({
        userId: actor.id,
        organizationId: org.id,
        action: AuditAction.MEMBER_ROLE_CHANGED,
        resource: "member",
        resourceId: id,
        metadata: { role },
      });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId, orgId } = await auth();
  if (!orgId || !clerkId) return new Response("Unauthorized", { status: 401 });

  const allowed = await checkOrgPermission("member:remove");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId: id,
    });

    const [actor, org] = await Promise.all([
      db.user.findUnique({ where: { clerkId }, select: { id: true } }),
      db.organization.findUnique({ where: { clerkOrgId: orgId }, select: { id: true } }),
    ]);
    if (actor && org) {
      void logAuditEvent({
        userId: actor.id,
        organizationId: org.id,
        action: AuditAction.MEMBER_REMOVED,
        resource: "member",
        resourceId: id,
      });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
