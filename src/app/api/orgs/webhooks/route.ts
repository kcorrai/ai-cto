import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";
import { encrypt } from "@/lib/crypto";
import { randomBytes } from "crypto";
import type { WebhookEvent } from "@prisma/client";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({ where: { clerkOrgId: orgCtx.clerkOrgId } });
  if (!org) return new Response("Not found", { status: 404 });

  const webhooks = await db.outboundWebhook.findMany({
    where: { organizationId: org.id },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      enabled: true,
      createdAt: true,
      _count: { select: { deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ webhooks });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await requireOrgPermission("org:settings");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({ where: { clerkOrgId: orgCtx.clerkOrgId } });
  if (!org) return new Response("Not found", { status: 404 });

  const body = (await req.json()) as { name?: string; url?: string; events?: string[] };
  if (!body.name || !body.url || !body.events?.length) {
    return new Response("name, url and events required", { status: 400 });
  }

  try {
    new URL(body.url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const rawSecret = randomBytes(24).toString("hex");
  const webhook = await db.outboundWebhook.create({
    data: {
      organizationId: org.id,
      name: body.name,
      url: body.url,
      events: body.events as WebhookEvent[],
      secret: encrypt(rawSecret),
    },
    select: { id: true, name: true, url: true, events: true, enabled: true, createdAt: true },
  });

  return Response.json({ webhook, secret: rawSecret }, { status: 201 });
}
