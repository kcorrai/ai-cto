import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({ where: { clerkOrgId: orgCtx.clerkOrgId } });
  if (!org) return new Response("Not found", { status: 404 });

  const webhook = await db.outboundWebhook.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true },
  });
  if (!webhook) return new Response("Not found", { status: 404 });

  const deliveries = await db.webhookDelivery.findMany({
    where: { webhookId: id },
    select: {
      id: true,
      event: true,
      status: true,
      statusCode: true,
      durationMs: true,
      attempt: true,
      deliveredAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = deliveries.length > limit;
  const page = hasMore ? deliveries.slice(0, limit) : deliveries;
  const nextCursor = hasMore ? page[page.length - 1]?.id : null;

  return Response.json({ deliveries: page, nextCursor });
}
