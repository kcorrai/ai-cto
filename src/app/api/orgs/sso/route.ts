import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { plan: true, settings: true },
  });
  if (!org) return new Response("Not found", { status: 404 });
  if (org.plan !== "enterprise") {
    return Response.json({ connections: [], requiresUpgrade: true });
  }

  const settings = org.settings as { samlConnectionIds?: string[] } | null;
  const ids = settings?.samlConnectionIds ?? [];

  if (ids.length === 0) return Response.json({ connections: [], requiresUpgrade: false });

  try {
    const client = await clerkClient();
    const { data: all } = await (
      client as unknown as ClerkClientWithSaml
    ).samlConnections.getSamlConnectionList({});
    const connections = all.filter((c) => ids.includes(c.id));
    return Response.json({ connections, requiresUpgrade: false });
  } catch {
    return Response.json({ connections: [], requiresUpgrade: false });
  }
}

export async function POST(req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, plan: true, settings: true },
  });
  if (!org) return new Response("Not found", { status: 404 });
  if (org.plan !== "enterprise") {
    return Response.json({ error: "Enterprise plan required for SSO" }, { status: 403 });
  }

  const body = (await req.json()) as {
    name: string;
    domain: string;
    provider: string;
    idpMetadataUrl?: string;
  };

  if (!body.name || !body.domain || !body.provider) {
    return Response.json({ error: "name, domain, and provider are required" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    const connection = await (
      client as unknown as ClerkClientWithSaml
    ).samlConnections.createSamlConnection({
      name: body.name,
      domain: body.domain.toLowerCase().trim(),
      provider: body.provider as "saml_custom" | "saml_okta" | "saml_azure_ad" | "saml_google",
      ...(body.idpMetadataUrl ? { idpMetadataUrl: body.idpMetadataUrl } : {}),
      attributeMapping: {
        userId: "user.id",
        emailAddress: "user.email",
        firstName: "user.firstName",
        lastName: "user.lastName",
      },
    });

    // Store connectionId in org settings
    const settings = (org.settings as { samlConnectionIds?: string[] } | null) ?? {};
    const existingIds = settings.samlConnectionIds ?? [];
    await db.organization.update({
      where: { id: org.id },
      data: {
        settings: { ...settings, samlConnectionIds: [...existingIds, connection.id] },
      },
    });

    return Response.json({ connection }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create SSO connection";
    return Response.json({ error: message }, { status: 422 });
  }
}

// Type stub for SAML API (Clerk Enterprise feature not in public types)
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
  createdAt: number;
  updatedAt: number;
};

type ClerkClientWithSaml = {
  samlConnections: {
    getSamlConnectionList: (params: object) => Promise<{ data: SamlConnection[] }>;
    getSamlConnection: (id: string) => Promise<SamlConnection>;
    createSamlConnection: (params: object) => Promise<SamlConnection>;
    updateSamlConnection: (id: string, params: object) => Promise<SamlConnection>;
    deleteSamlConnection: (id: string) => Promise<void>;
  };
};
