import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await requireOrgPermission("org:settings");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return new Response("No active organization", { status: 400 });

  await db.organization.update({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    data: {
      slackBotToken: null,
      slackTeamId: null,
      slackChannelId: null,
      slackChannelName: null,
      slackConfig: {},
    },
  });

  return Response.json({ ok: true });
}
