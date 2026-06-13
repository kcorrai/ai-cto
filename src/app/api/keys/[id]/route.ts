import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const key = await db.apiKey.findFirst({
    where: { id, userId: user.id, isActive: true },
    select: { id: true },
  });
  if (!key) return new Response("Not found", { status: 404 });

  await db.apiKey.update({ where: { id }, data: { isActive: false } });

  return new Response(null, { status: 204 });
}
