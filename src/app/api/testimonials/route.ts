import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const SubmitSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.string().max(255).optional(),
  productName: z.string().max(255).optional(),
  quote: z.string().min(10).max(500),
  twitterUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();

  let userId: string | null = null;
  let avatarUrl: string | null = null;
  if (clerkId) {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, avatarUrl: true },
    });
    userId = user?.id ?? null;
    avatarUrl = user?.avatarUrl ?? null;
  }

  const body = await req.json().catch(() => null);
  const result = SubmitSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const { name, role, productName, quote, twitterUrl } = result.data;

  await db.testimonial.create({
    data: {
      userId,
      name,
      role: role ?? null,
      productName: productName ?? null,
      quote,
      avatarUrl,
      twitterUrl: twitterUrl || null,
      status: "pending",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const testimonials = await db.testimonial.findMany({
    where: { status: "approved" },
    select: {
      id: true,
      name: true,
      role: true,
      productName: true,
      avatarUrl: true,
      quote: true,
      twitterUrl: true,
      approvedAt: true,
    },
    orderBy: { approvedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(testimonials);
}
