import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyReferral } from "@/lib/referral";
import { z } from "zod";

const Body = z.object({ code: z.string().min(1).max(20) });

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const result = Body.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, referredById: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only apply once
  if (user.referredById) return NextResponse.json({ ok: true });

  await applyReferral(user.id, result.data.code);
  return NextResponse.json({ ok: true });
}
