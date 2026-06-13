import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { ActivityEventType } from "@prisma/client";

export async function GET(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new Response("Unauthorized", { status: 401 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true },
  });
  if (!org) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const filterUserId = url.searchParams.get("userId") ?? undefined;
  const filterType = url.searchParams.get("type") as ActivityEventType | undefined;
  const limit = 20;

  const events = await db.activityEvent.findMany({
    where: {
      organizationId: org.id,
      ...(filterUserId ? { userId: filterUserId } : {}),
      ...(filterType ? { eventType: filterType } : {}),
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    select: {
      id: true,
      eventType: true,
      targetType: true,
      targetId: true,
      targetName: true,
      metadata: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? items[items.length - 1]?.createdAt.toISOString() : null;

  return Response.json({ events: items, nextCursor, hasMore });
}
