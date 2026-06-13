import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { env } from "@/env";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";

const bodySchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireOrgPermission("billing:manage");

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: { id: true, name: true, stripeCustomerId: true, plan: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (org.plan === "team" || org.plan === "enterprise") {
    return NextResponse.json({ error: "Already on a paid plan" }, { status: 400 });
  }

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await db.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Use STRIPE_TEAM_MONTHLY_PRICE_ID / YEARLY or fall back to PRO prices for now
  const priceId =
    parsed.data.interval === "yearly"
      ? (process.env.STRIPE_TEAM_YEARLY_PRICE_ID ?? env.STRIPE_PRO_YEARLY_PRICE_ID)
      : (process.env.STRIPE_TEAM_MONTHLY_PRICE_ID ?? env.STRIPE_PRO_MONTHLY_PRICE_ID);

  if (!priceId) return NextResponse.json({ error: "Team price not configured" }, { status: 503 });

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: org.id, plan: "team" },
    },
    metadata: { organizationId: org.id, plan: "team" },
    success_url: `${appUrl}/team?upgraded=true`,
    cancel_url: `${appUrl}/team`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
