import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";

type SlackConfig = {
  analysis_complete?: boolean;
  critical_finding?: boolean;
  weekly_digest?: boolean;
  findings_resolved?: boolean;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: {
      slackTeamId: true,
      slackChannelName: true,
      slackConfig: true,
    },
  });

  return Response.json({ org });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await requireOrgPermission("org:settings");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  const body = (await req.json()) as {
    config?: SlackConfig;
    channelId?: string;
    channelName?: string;
  };

  const data: Record<string, unknown> = {};
  if (body.config) data.slackConfig = body.config;
  if (body.channelId) data.slackChannelId = body.channelId;
  if (body.channelName) data.slackChannelName = body.channelName;

  await db.organization.update({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    data,
  });

  return Response.json({ ok: true });
}
