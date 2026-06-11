import { env } from "@/env";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { Webhook } from "svix";

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

    await db.user.create({
      data: {
        clerkId: data.id as string,
        email,
        name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        avatarUrl: (data.image_url as string) || null,
      },
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

  return new Response("OK", { status: 200 });
}
