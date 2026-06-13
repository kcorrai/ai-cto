import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, plan: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Monitoring mode requires Pro+
  if (user.plan === "free") {
    return NextResponse.json({ error: "Monitoring mode requires a Pro plan" }, { status: 403 });
  }

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { enabled: boolean };
  const updated = await db.project.update({
    where: { id },
    data: { monitoringEnabled: body.enabled },
    select: { monitoringEnabled: true },
  });

  return NextResponse.json(updated);
}
