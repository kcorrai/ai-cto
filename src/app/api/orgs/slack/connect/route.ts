import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { env } from "@/env";
import { getActiveOrg } from "@/lib/auth/org";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({ where: { clerkOrgId: orgCtx.clerkOrgId } });
  if (!org) return new Response("Organization not found", { status: 404 });

  if (!env.SLACK_CLIENT_ID) return new Response("Slack not configured", { status: 503 });

  const state = Buffer.from(JSON.stringify({ orgId: org.id })).toString("base64url");
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/orgs/slack/callback`;

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", env.SLACK_CLIENT_ID);
  url.searchParams.set("scope", "chat:write,channels:read,groups:read");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return Response.redirect(url.toString());
}
