import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireOrgPermission("billing:manage");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: { stripeCustomerId: true },
  });
  if (!org?.stripeCustomerId) return NextResponse.json({ invoices: [] });

  const invoices = await getStripe().invoices.list({
    customer: org.stripeCustomerId,
    limit: 24,
  });

  const result = invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amount: inv.amount_due,
    currency: inv.currency,
    dueDate: inv.due_date,
    created: inv.created,
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url,
    poNumber: (inv.metadata?.po_number as string | undefined) ?? null,
    description: inv.description,
  }));

  return NextResponse.json({ invoices: result });
}
