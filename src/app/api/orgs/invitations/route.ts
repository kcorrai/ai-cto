import { auth, clerkClient } from "@clerk/nextjs/server";
import { env } from "@/env";

export async function POST(req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = (await req.json()) as { emailAddress: string; role?: string };
  const { emailAddress, role = "org:member" } = body;

  if (!emailAddress || typeof emailAddress !== "string") {
    return Response.json({ error: "Email address is required" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress,
      role,
      redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      inviterUserId: userId,
    });

    return Response.json({ invitation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invitation";
    return Response.json({ error: message }, { status: 422 });
  }
}

export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const client = await clerkClient();
    const { data: invitations } = await client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
    });

    return Response.json({ invitations });
  } catch {
    return Response.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}
