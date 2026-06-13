import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type ClerkClientWithSaml = {
  samlConnections: {
    getSamlConnection: (id: string) => Promise<{
      id: string;
      acsUrl: string;
      spEntityId: string;
      spMetadataUrl: string;
    }>;
  };
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { plan: true, settings: true },
  });
  if (!org || org.plan !== "enterprise") return new Response("Not found", { status: 404 });

  const settings = org.settings as { samlConnectionIds?: string[] } | null;
  if (!(settings?.samlConnectionIds ?? []).includes(id)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const client = await clerkClient();
    const conn = await (client as unknown as ClerkClientWithSaml).samlConnections.getSamlConnection(
      id
    );

    return Response.json({
      connectionId: conn.id,
      acsUrl: conn.acsUrl,
      entityId: conn.spEntityId,
      metadataUrl: conn.spMetadataUrl,
    });
  } catch {
    return new Response("Connection not found", { status: 404 });
  }
}
