import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const comments = await db.findingComment.findMany({
    where: { findingId: id },
    select: {
      id: true,
      content: true,
      editedAt: true,
      createdAt: true,
      user: { select: { id: true, clerkId: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ comments });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return new Response("User not found", { status: 404 });

  const { id } = await params;
  const body = (await req.json()) as { content: string };
  const { content } = body;

  if (!content?.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const finding = await db.finding.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!finding) return new Response("Finding not found", { status: 404 });

  const comment = await db.findingComment.create({
    data: {
      findingId: id,
      userId: dbUser.id,
      content: content.trim(),
    },
    select: {
      id: true,
      content: true,
      editedAt: true,
      createdAt: true,
      user: { select: { id: true, clerkId: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return Response.json({ comment }, { status: 201 });
}
