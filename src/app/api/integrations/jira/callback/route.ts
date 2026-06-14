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

  if (!code || !state) return redirect("/settings?error=jira_oauth_failed");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return redirect("/sign-in");

  const settings = (user.settings as Record<string, unknown>) ?? {};
  if (settings.jiraOAuthState !== state) {
    return redirect("/settings?error=jira_oauth_state_mismatch");
  }

  const clientId = env.JIRA_CLIENT_ID;
  const clientSecret = env.JIRA_CLIENT_SECRET;
  if (!clientId || !clientSecret) return redirect("/settings?error=jira_not_configured");

  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`;

  const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  });

  if (!tokenRes.ok) return redirect("/settings?error=jira_token_exchange_failed");

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
  };

  // Get accessible Jira cloud sites
  const sitesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/json" },
  });

  if (!sitesRes.ok) return redirect("/settings?error=jira_sites_failed");

  const sites = (await sitesRes.json()) as { id: string; name: string; url: string }[];
  const site = sites[0];
  if (!site) return redirect("/settings?error=jira_no_sites");

  const newSettings = { ...settings };
  delete newSettings.jiraOAuthState;
  newSettings.jiraAccessToken = encrypt(tokenData.access_token);
  newSettings.jiraCloudId = site.id;
  newSettings.jiraCloudName = site.name;
  if (tokenData.refresh_token) {
    newSettings.jiraRefreshToken = encrypt(tokenData.refresh_token);
  }

  await db.user.update({
    where: { id: user.id },
    data: { settings: newSettings as Prisma.InputJsonValue },
  });

  return redirect("/settings?success=jira_connected");
}
