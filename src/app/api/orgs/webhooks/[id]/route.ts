import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";
import type { WebhookEvent } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await requireOrgPermission("org:settings");

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    url?: string;
    events?: string[];
    enabled?: boolean;
  };

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({ where: { clerkOrgId: orgCtx.clerkOrgId } });
  if (!org) return new Response("Not found", { status: 404 });

  const webhook = await db.outboundWebhook.findFirst({
    where: { id, organizationId: org.id },
  });
  if (!webhook) return new Response("Not found", { status: 404 });

  if (body.url) {
    try {
      new URL(body.url);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }
  }

  const updated = await db.outboundWebhook.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.url !== undefined ? { url: body.url } : {}),
      ...(body.events !== undefined ? { events: body.events as WebhookEvent[] } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    },
    select: { id: true, name: true, url: true, events: true, enabled: true },
  });

  return Response.json({ webhook: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await requireOrgPermission("org:settings");

  const { id } = await params;

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({ where: { clerkOrgId: orgCtx.clerkOrgId } });
  if (!org) return new Response("Not found", { status: 404 });

  const webhook = await db.outboundWebhook.findFirst({
    where: { id, organizationId: org.id },
  });
  if (!webhook) return new Response("Not found", { status: 404 });

  await db.outboundWebhook.delete({ where: { id } });

  return Response.json({ ok: true });
}
