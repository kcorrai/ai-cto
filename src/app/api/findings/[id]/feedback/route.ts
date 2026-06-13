import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const feedbackSchema = z.object({
  vote: z.enum(["up", "down"]),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Verify finding belongs to user's project
  const finding = await db.finding.findFirst({
    where: { id, project: { userId: user.id } },
    select: { id: true, metadata: true },
  });
  if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingMeta = (finding.metadata as Record<string, unknown>) ?? {};
  const feedback = {
    vote: parsed.data.vote,
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
    createdAt: new Date().toISOString(),
    userId: user.id,
  };

  await db.finding.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { metadata: { ...existingMeta, feedback } as any },
  });

  return NextResponse.json({ ok: true });
}
