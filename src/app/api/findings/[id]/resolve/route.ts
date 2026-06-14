import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheInvalidate, cacheKeys } from "@/lib/cache";

export async function PATCH(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership — finding must belong to a project owned by this user
  const finding = await db.finding.findFirst({
    where: { id },
    select: { id: true, analysisId: true, project: { select: { userId: true } } },
  });

  if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (finding.project.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.finding.update({
    where: { id },
    data: { isResolved: true, resolvedAt: new Date(), resolvedById: user.id },
  });

  // Invalidate analysis cache so next load reflects the resolved finding
  await cacheInvalidate(cacheKeys.analysis(finding.analysisId));

  return NextResponse.json({ ok: true });
}
