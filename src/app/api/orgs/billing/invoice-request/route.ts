import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";
import { getStripe } from "@/lib/stripe/client";
import { env } from "@/env";

const bodySchema = z.object({
  billingEmail: z.string().email(),
  poNumber: z.string().max(100).optional(),
  seats: z.number().int().min(1).max(1000),
  companyName: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireOrgPermission("billing:manage");

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { billingEmail, poNumber, seats, companyName } = parsed.data;

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: { id: true, name: true, stripeCustomerId: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  // Ensure Stripe customer exists
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: billingEmail,
      name: companyName ?? org.name ?? undefined,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await db.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  } else {
    await getStripe().customers.update(customerId, {
      email: billingEmail,
      ...(companyName ? { name: companyName } : {}),
    });
  }

  const enterprisePriceId = process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID;
  if (!enterprisePriceId) {
    // No price configured — create a one-time invoice to capture the request
    const invoice = await getStripe().invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 30,
      description: `Enterprise plan — ${seats} seat${seats > 1 ? "s" : ""} (invoice billing request)`,
      metadata: {
        organizationId: org.id,
        ...(poNumber ? { po_number: poNumber } : {}),
        seats: String(seats),
        type: "invoice_request",
      },
    });
    await getStripe().invoices.finalizeInvoice(invoice.id);
    return NextResponse.json({ status: "requested", invoiceId: invoice.id });
  }

  // Create subscription with invoice billing (no credit card required)
  const sub = await getStripe().subscriptions.create({
    customer: customerId,
    items: [{ price: enterprisePriceId, quantity: seats }],
    collection_method: "send_invoice",
    days_until_due: 30,
    payment_settings: {
      payment_method_types: ["us_bank_account", "ach_debit"],
      save_default_payment_method: "on_subscription",
    },
    metadata: {
      organizationId: org.id,
      plan: "enterprise",
      ...(poNumber ? { po_number: poNumber } : {}),
    },
  });

  // Update org plan in DB
  await db.organization.update({
    where: { id: org.id },
    data: { plan: "enterprise" },
  });

  return NextResponse.json({ status: "created", subscriptionId: sub.id });
}
