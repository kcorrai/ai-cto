import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/env";
import { encrypt } from "@/lib/crypto";

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return redirect("/sign-in");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return redirect("/settings?error=linear_oauth_failed");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return redirect("/sign-in");

  const settings = (user.settings as Record<string, unknown>) ?? {};
  if (settings.linearOAuthState !== state) {
    return redirect("/settings?error=linear_oauth_state_mismatch");
  }

  const clientId = env.LINEAR_CLIENT_ID;
  const clientSecret = env.LINEAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) return redirect("/settings?error=linear_not_configured");

  // Exchange code for token
  const tokenRes = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/integrations/linear/callback`,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return redirect("/settings?error=linear_token_exchange_failed");

  const tokenData = (await tokenRes.json()) as { access_token: string; scope: string };
  const encryptedToken = encrypt(tokenData.access_token);

  // Get user info from Linear
  const meRes = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({ query: "query { viewer { id name email } }" }),
  });
  const meData = (await meRes.json()) as { data?: { viewer?: { id: string; name: string } } };
  const linearUser = meData.data?.viewer;

  const newSettings = { ...settings };
  delete newSettings.linearOAuthState;
  newSettings.linearAccessToken = encryptedToken;
  if (linearUser) {
    newSettings.linearUserId = linearUser.id;
    newSettings.linearUserName = linearUser.name;
  }

  await db.user.update({
    where: { id: user.id },
    data: { settings: newSettings as Prisma.InputJsonValue },
  });

  return redirect("/settings?success=linear_connected");
}
