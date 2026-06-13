import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { env } from "@/env";
import { creditReferrer } from "@/lib/referral";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, plan } = session.metadata ?? {};
  if (!userId || plan !== "pro") return;

  const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
  const priceId = sub.items.data[0]?.price.id ?? "";

  await db.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: {
        userId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status: sub.status as never,
        plan: "pro",
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        status: sub.status as never,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
    await tx.user.update({ where: { id: userId }, data: { plan: "pro" } });
  });

  // Credit referrer if this is a first conversion
  void creditReferrer(userId);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { userId: true },
  });
  if (!existing) return;

  const priceId = sub.items.data[0]?.price.id ?? "";
  await db.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      stripePriceId: priceId,
      status: sub.status as never,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { userId: true, organizationId: true },
  });
  if (!existing) return;

  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { stripeSubscriptionId: sub.id },
      data: { status: "canceled", canceledAt: new Date() },
    });
    if (existing.userId) {
      await tx.user.update({ where: { id: existing.userId }, data: { plan: "free" } });
    } else if (existing.organizationId) {
      await tx.organization.update({
        where: { id: existing.organizationId },
        data: { plan: "free" },
      });
    }
  });
}

export async function POST(req: Request) {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook secret not configured", { status: 500 });

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      // invoice.payment_failed — email notification handled in TASK-025
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook error [${event.type}]:`, err);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
