import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { env } from "@/env";
import { getActiveOrg } from "@/lib/auth/org";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: { stripeCustomerId: true },
  });

  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/team`,
  });

  return NextResponse.json({ url: session.url });
}
