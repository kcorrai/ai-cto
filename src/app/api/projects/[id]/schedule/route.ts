import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { ScheduleFrequency } from "@prisma/client";

function nextRunDate(frequency: ScheduleFrequency): Date {
  const now = new Date();
  switch (frequency) {
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "biweekly":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "monthly":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const project = await db.project.findFirst({
    where: { id, userId: dbUser.id },
    select: { scheduledAnalysis: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  return Response.json({ schedule: project.scheduledAnalysis });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as { frequency?: string; enabled?: boolean };

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const project = await db.project.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  const VALID_FREQUENCIES: ScheduleFrequency[] = ["daily", "weekly", "biweekly", "monthly"];
  if (body.frequency && !VALID_FREQUENCIES.includes(body.frequency as ScheduleFrequency)) {
    return new Response("Invalid frequency", { status: 400 });
  }

  const frequency = (body.frequency as ScheduleFrequency) ?? "weekly";
  const schedule = await db.scheduledAnalysis.upsert({
    where: { projectId: id },
    create: {
      projectId: id,
      frequency,
      enabled: body.enabled ?? true,
      nextRunAt: nextRunDate(frequency),
    },
    update: {
      ...(body.frequency ? { frequency, nextRunAt: nextRunDate(frequency) } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    },
  });

  return Response.json({ schedule });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const project = await db.project.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  await db.scheduledAnalysis.deleteMany({ where: { projectId: id } });

  return Response.json({ ok: true });
}
