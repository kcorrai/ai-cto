import { env } from "@/env";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { getStripe } from "@/lib/stripe/client";
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  let event: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return new Response("Invalid signature", { status: 403 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const email = (
      (data.email_addresses as Array<{ email_address: string; id: string }>) ?? []
    ).find((e) => e.id === data.primary_email_address_id)?.email_address;

    if (!email) {
      return new Response("No primary email", { status: 400 });
    }

    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
    const user = await db.user.create({
      data: {
        clerkId: data.id as string,
        email,
        name,
        avatarUrl: (data.image_url as string) || null,
      },
    });

    // Create Stripe customer eagerly so portal always works
    if (env.STRIPE_SECRET_KEY) {
      try {
        const customer = await getStripe().customers.create({
          email,
          ...(name ? { name } : {}),
          metadata: { userId: user.id },
        });
        await db.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customer.id },
        });
      } catch {
        // Non-fatal — checkout handler creates customer lazily if needed
      }
    }

    // Send welcome email (non-blocking)
    void sendEmail({
      to: email,
      subject: "Welcome to AI CTO — Run your first analysis",
      react: WelcomeEmail({ name: name ?? email, appUrl: env.NEXT_PUBLIC_APP_URL }),
    });
  }

  if (type === "user.updated") {
    const email = (
      (data.email_addresses as Array<{ email_address: string; id: string }>) ?? []
    ).find((e) => e.id === data.primary_email_address_id)?.email_address;

    await db.user.update({
      where: { clerkId: data.id as string },
      data: {
        ...(email ? { email } : {}),
        name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        avatarUrl: (data.image_url as string) || null,
      },
    });
  }

  if (type === "user.deleted") {
    await db.user.update({
      where: { clerkId: data.id as string },
      data: { deletedAt: new Date() },
    });
  }

  if (type === "organization.created") {
    await db.organization.create({
      data: {
        clerkOrgId: data.id as string,
        name: data.name as string,
        slug: data.slug as string,
        logoUrl: (data.image_url as string) || null,
      },
    });
  }

  if (type === "organization.updated") {
    await db.organization.update({
      where: { clerkOrgId: data.id as string },
      data: {
        name: data.name as string,
        slug: data.slug as string,
        logoUrl: (data.image_url as string) || null,
      },
    });
  }

  if (type === "organization.deleted") {
    await db.organization.update({
      where: { clerkOrgId: data.id as string },
      data: { deletedAt: new Date() },
    });
  }

  if (type === "organizationMembership.created") {
    const orgData = data.organization as { id: string };
    const memberData = data.public_user_data as { user_id: string };

    const [org, user] = await Promise.all([
      db.organization.findUnique({ where: { clerkOrgId: orgData.id }, select: { id: true } }),
      db.user.findUnique({ where: { clerkId: memberData.user_id }, select: { id: true } }),
    ]);

    if (org && user) {
      const role =
        (data.role as string) === "org:admin"
          ? "admin"
          : (data.role as string) === "org:member"
            ? "editor"
            : "viewer";
      await db.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
        create: {
          organizationId: org.id,
          userId: user.id,
          role: role as "admin" | "editor" | "viewer",
        },
        update: { role: role as "admin" | "editor" | "viewer" },
      });
    }
  }

  if (type === "organizationMembership.updated") {
    const orgData = data.organization as { id: string };
    const memberData = data.public_user_data as { user_id: string };

    const [org, user] = await Promise.all([
      db.organization.findUnique({ where: { clerkOrgId: orgData.id }, select: { id: true } }),
      db.user.findUnique({ where: { clerkId: memberData.user_id }, select: { id: true } }),
    ]);

    if (org && user) {
      const role =
        (data.role as string) === "org:admin"
          ? "admin"
          : (data.role as string) === "org:member"
            ? "editor"
            : "viewer";
      await db.organizationMember.update({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
        data: { role: role as "admin" | "editor" | "viewer" },
      });
    }
  }

  if (type === "organizationMembership.deleted") {
    const orgData = data.organization as { id: string };
    const memberData = data.public_user_data as { user_id: string };

    const [org, user] = await Promise.all([
      db.organization.findUnique({ where: { clerkOrgId: orgData.id }, select: { id: true } }),
      db.user.findUnique({ where: { clerkId: memberData.user_id }, select: { id: true } }),
    ]);

    if (org && user) {
      await db.organizationMember.deleteMany({
        where: { organizationId: org.id, userId: user.id },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
