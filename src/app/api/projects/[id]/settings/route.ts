import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  autoAnalyze: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, plan: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id, status: { not: "deleted" } },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const result = UpdateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Auto-analyze is a Pro+ feature
  if (result.data.autoAnalyze && user.plan === "free") {
    return NextResponse.json({ error: "Pro plan required for auto-analyze" }, { status: 403 });
  }

  const data: { autoAnalyze?: boolean } = {};
  if (result.data.autoAnalyze !== undefined) data.autoAnalyze = result.data.autoAnalyze;

  const updated = await db.project.update({
    where: { id: projectId },
    data,
    select: { id: true, autoAnalyze: true },
  });

  return NextResponse.json(updated);
}
