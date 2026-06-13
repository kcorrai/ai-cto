import { auth, clerkClient } from "@clerk/nextjs/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;

  try {
    const client = await clerkClient();
    await client.organizations.revokeOrganizationInvitation({
      organizationId: orgId,
      invitationId: id,
      requestingUserId: userId,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to revoke invitation" }, { status: 500 });
  }
}
