import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SlackSettings } from "@/components/team/SlackSettings";

type SlackConfig = {
  analysis_complete: boolean;
  critical_finding: boolean;
  weekly_digest: boolean;
  findings_resolved: boolean;
};

export default async function TeamSettingsPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: {
      slackTeamId: true,
      slackChannelName: true,
      slackConfig: true,
    },
  });

  if (!org) redirect("/dashboard");

  const connected = !!org.slackTeamId;
  const config = org.slackConfig as SlackConfig | null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">Team Settings</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Integrations and notifications</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <SlackSettings connected={connected} channelName={org.slackChannelName} config={config} />
      </div>
    </div>
  );
}
