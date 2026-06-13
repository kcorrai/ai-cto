import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/env";

// GET: initiate OAuth
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const clientId = env.LINEAR_CLIENT_ID;
  if (!clientId) return new Response("Linear integration not configured", { status: 503 });

  const state = randomBytes(16).toString("hex");
  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/linear/callback`;

  // Store state temporarily in user settings
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  await db.user.update({
    where: { id: user.id },
    data: {
      settings: { ...(user.settings as object), linearOAuthState: state } as Prisma.InputJsonValue,
    },
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "read,write",
    state,
  });

  return redirect(`https://linear.app/oauth/authorize?${params.toString()}`);
}

// DELETE: disconnect Linear
export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const settings = { ...(user.settings as object) } as Record<string, unknown>;
  delete settings.linearAccessToken;
  delete settings.linearUserId;
  delete settings.linearUserName;

  await db.user.update({
    where: { id: user.id },
    data: { settings: settings as Prisma.InputJsonValue },
  });

  return new Response(null, { status: 204 });
}
