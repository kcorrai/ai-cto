import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureReferralCode, getReferralStats } from "@/lib/referral";
import { env } from "@/env";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = await ensureReferralCode(user.id);
  const stats = await getReferralStats(user.id);

  return NextResponse.json({
    code,
    link: `${env.NEXT_PUBLIC_APP_URL}/r/${code}`,
    ...stats,
  });
}
