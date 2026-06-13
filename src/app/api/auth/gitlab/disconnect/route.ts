import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, settings: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    gitlabAccessToken: _t,
    gitlabUsername: _u,
    gitlabHost: _h,
    ...rest
  } = (user.settings ?? {}) as Record<string, unknown>;

  await db.user.update({
    where: { clerkId: userId },
    data: { settings: JSON.parse(JSON.stringify(rest)) },
  });

  return NextResponse.json({ ok: true });
}
