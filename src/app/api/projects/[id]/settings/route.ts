import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  autoAnalyze: z.boolean().optional(),
  monitoringEnabled: z.boolean().optional(),
  benchmarkOptIn: z.boolean().optional(),
  tags: z.array(z.string().max(20)).max(5).optional(),
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

  if (result.data.autoAnalyze && user.plan === "free") {
    return NextResponse.json({ error: "Pro plan required for auto-analyze" }, { status: 403 });
  }
  if (result.data.monitoringEnabled && user.plan === "free") {
    return NextResponse.json({ error: "Pro plan required for monitoring" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (result.data.autoAnalyze !== undefined) data.autoAnalyze = result.data.autoAnalyze;
  if (result.data.monitoringEnabled !== undefined)
    data.monitoringEnabled = result.data.monitoringEnabled;
  if (result.data.benchmarkOptIn !== undefined) data.benchmarkOptIn = result.data.benchmarkOptIn;
  if (result.data.tags !== undefined) {
    data.tags = result.data.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data,
    select: {
      id: true,
      autoAnalyze: true,
      monitoringEnabled: true,
      benchmarkOptIn: true,
      tags: true,
    },
  });

  return NextResponse.json(updated);
}
