import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const ADMIN_IDS = (process.env.ADMIN_CLERK_IDS ?? "").split(",").filter(Boolean);

const Body = z.object({ status: z.enum(["approved", "rejected"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId || !ADMIN_IDS.includes(clerkId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const result = Body.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updated = await db.testimonial.update({
    where: { id },
    data: {
      status: result.data.status,
      approvedAt: result.data.status === "approved" ? new Date() : null,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}
