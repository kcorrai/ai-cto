import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return new Response("User not found", { status: 404 });

  const { commentId } = await params;
  const comment = await db.findingComment.findUnique({
    where: { id: commentId },
    select: { userId: true, createdAt: true },
  });

  if (!comment) return new Response("Not found", { status: 404 });
  if (comment.userId !== dbUser.id) return new Response("Forbidden", { status: 403 });
  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return Response.json({ error: "Edit window has passed (15 minutes)" }, { status: 422 });
  }

  const body = (await req.json()) as { content: string };
  const updated = await db.findingComment.update({
    where: { id: commentId },
    data: { content: body.content.trim(), editedAt: new Date() },
    select: {
      id: true,
      content: true,
      editedAt: true,
      createdAt: true,
      user: { select: { id: true, clerkId: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return Response.json({ comment: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return new Response("User not found", { status: 404 });

  const { commentId } = await params;
  const comment = await db.findingComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) return new Response("Not found", { status: 404 });
  if (comment.userId !== dbUser.id) return new Response("Forbidden", { status: 403 });

  await db.findingComment.delete({ where: { id: commentId } });
  return Response.json({ success: true });
}
