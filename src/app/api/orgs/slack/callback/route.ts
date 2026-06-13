import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { env } from "@/env";
import { storeSlackCredentials } from "@/lib/slack";
import { logActivity } from "@/lib/activity";

type SlackOAuthResponse = {
  ok: boolean;
  access_token?: string;
  team?: { id: string; name: string };
  incoming_webhook?: { channel: string; channel_id: string };
  authed_user?: { id: string };
  bot_user_id?: string;
  error?: string;
};

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/sign-in`);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/team?slack_error=${error ?? "missing_params"}`
    );
  }

  let orgId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString()) as { orgId: string };
    orgId = decoded.orgId;
  } catch {
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/team?slack_error=invalid_state`);
  }

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/team?slack_error=org_not_found`);

  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/team?slack_error=not_configured`);
  }

  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/orgs/slack/callback`;
  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await tokenRes.json()) as SlackOAuthResponse;
  if (!data.ok || !data.access_token || !data.team) {
    return Response.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/team?slack_error=${data.error ?? "oauth_failed"}`
    );
  }

  const channelId = data.incoming_webhook?.channel_id ?? "general";
  const channelName = data.incoming_webhook?.channel ?? "general";

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  await storeSlackCredentials({
    orgId,
    botToken: data.access_token,
    teamId: data.team.id,
    channelId,
    channelName,
  });

  if (dbUser) {
    await logActivity({
      organizationId: orgId,
      userId: dbUser.id,
      eventType: "member_invited",
      targetName: `Slack workspace: ${data.team.name}`,
    });
  }

  return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/team?slack_connected=1`);
}
