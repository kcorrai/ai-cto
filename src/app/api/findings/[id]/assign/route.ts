import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as { assignedToId: string | null };

  const finding = await db.finding.update({
    where: { id },
    data: { assignedToId: body.assignedToId ?? null },
    select: {
      id: true,
      assignedToId: true,
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return Response.json({ finding });
}
