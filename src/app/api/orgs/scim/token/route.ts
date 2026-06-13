import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { nanoid } from "nanoid";

export async function GET() {
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
    return Response.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const settings = org.settings as { scimToken?: string } | null;
  const hasToken = !!settings?.scimToken;

  // Never return the raw token in GET — just confirm presence
  return Response.json({ hasToken, scimBaseUrl: `/api/scim/v2` });
}

export async function POST() {
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
    return Response.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  // Token format: scim_{orgId}_{random32}
  const raw = `scim_${org.id}_${nanoid(32)}`;
  const encrypted = encrypt(raw);

  const current = (org.settings ?? {}) as { scimToken?: string; samlConnectionIds?: string[] };
  await db.organization.update({
    where: { id: org.id },
    data: { settings: { ...current, scimToken: encrypted } },
  });

  // Return raw token ONCE — never again retrievable
  return Response.json({ token: raw, scimBaseUrl: `/api/scim/v2` }, { status: 201 });
}

export async function DELETE() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, plan: true, settings: true },
  });
  if (!org) return new Response("Not found", { status: 404 });

  const current = (org.settings ?? {}) as { scimToken?: string; samlConnectionIds?: string[] };
  const { scimToken: _removed, ...rest } = current;
  await db.organization.update({
    where: { id: org.id },
    data: { settings: rest },
  });

  return new Response(null, { status: 204 });
}
