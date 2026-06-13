import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type ClerkClientWithSaml = {
  samlConnections: {
    getSamlConnection: (id: string) => Promise<SamlConnection>;
    updateSamlConnection: (id: string, params: object) => Promise<SamlConnection>;
    deleteSamlConnection: (id: string) => Promise<void>;
  };
};

type SamlConnection = {
  id: string;
  name: string;
  domain: string;
  provider: string;
  active: boolean;
  acsUrl: string;
  spEntityId: string;
  spMetadataUrl: string;
  idpMetadataUrl?: string;
  idpEntityId?: string;
  idpSsoUrl?: string;
};

async function getOrgAndVerify(orgId: string, orgRole: string, connectionId: string) {
  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return null;

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, plan: true, settings: true },
  });
  if (!org || org.plan !== "enterprise") return null;

  const settings = org.settings as { samlConnectionIds?: string[] } | null;
  const ids = settings?.samlConnectionIds ?? [];
  if (!ids.includes(connectionId)) return null;

  return org;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const org = await getOrgAndVerify(orgId, orgRole ?? "", id);
  if (!org) return new Response("Not found", { status: 404 });

  try {
    const client = await clerkClient();
    const connection = await (
      client as unknown as ClerkClientWithSaml
    ).samlConnections.getSamlConnection(id);
    return Response.json({ connection });
  } catch {
    return new Response("Connection not found", { status: 404 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const org = await getOrgAndVerify(orgId, orgRole ?? "", id);
  if (!org) return new Response("Not found", { status: 404 });

  const body = (await req.json()) as {
    active?: boolean;
    idpMetadataUrl?: string;
    idpEntityId?: string;
    idpSsoUrl?: string;
    idpCertificate?: string;
    name?: string;
  };

  try {
    const client = await clerkClient();
    const connection = await (
      client as unknown as ClerkClientWithSaml
    ).samlConnections.updateSamlConnection(id, body);
    return Response.json({ connection });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update connection";
    return Response.json({ error: message }, { status: 422 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const org = await getOrgAndVerify(orgId, orgRole ?? "", id);
  if (!org) return new Response("Not found", { status: 404 });

  try {
    const client = await clerkClient();
    await (client as unknown as ClerkClientWithSaml).samlConnections.deleteSamlConnection(id);

    // Remove from org settings
    const settings = (org.settings as { samlConnectionIds?: string[] } | null) ?? {};
    const remaining = (settings.samlConnectionIds ?? []).filter((cid) => cid !== id);
    await db.organization.update({
      where: { id: org.id },
      data: { settings: { ...settings, samlConnectionIds: remaining } },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete connection";
    return Response.json({ error: message }, { status: 422 });
  }
}
