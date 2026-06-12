import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/client";
import { getProPriceId } from "@/lib/stripe/plans";
import { db } from "@/lib/db";
import { env } from "@/env";

const bodySchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { interval } = parsed.data;

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure Stripe customer exists
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      ...(user.name ? { name: user.name } : {}),
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const priceId = getProPriceId(interval);
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId: user.id, plan: "pro" },
    },
    metadata: { userId: user.id, plan: "pro" },
    success_url: `${appUrl}/settings?upgraded=true`,
    cancel_url: `${appUrl}/settings`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
