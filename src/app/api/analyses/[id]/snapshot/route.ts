import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const analysis = await db.analysis.findFirst({
    where: { id },
    select: {
      status: true,
      progress: true,
      project: { select: { userId: true } },
      modules: {
        select: { module: true, status: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (analysis.project.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    status: analysis.status,
    progress: analysis.progress,
    modules: analysis.modules,
  });
}
