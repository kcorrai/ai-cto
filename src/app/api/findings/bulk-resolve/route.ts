import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as { ids: string[] };
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return Response.json({ updated: 0 });

  // Verify all findings belong to this user before resolving
  const findings = await db.finding.findMany({
    where: { id: { in: ids } },
    select: { id: true, project: { select: { userId: true } } },
  });

  const ownedIds = findings.filter((f) => f.project.userId === user.id).map((f) => f.id);

  if (ownedIds.length === 0) return Response.json({ updated: 0 });

  const result = await db.finding.updateMany({
    where: { id: { in: ownedIds }, isResolved: false },
    data: { isResolved: true, resolvedAt: new Date(), resolvedById: user.id },
  });

  return Response.json({ updated: result.count });
}
