import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SlackSettings } from "@/components/team/SlackSettings";
import { WebhookManager } from "@/components/team/WebhookManager";
import { TeamBilling } from "@/components/team/TeamBilling";
import { InvoiceBilling } from "@/components/team/InvoiceBilling";
import { RetentionSettings } from "@/components/team/RetentionSettings";
import { WhiteLabelSettings } from "@/components/team/WhiteLabelSettings";
import { GHESettings } from "@/components/team/GHESettings";

type SlackConfig = {
  analysis_complete: boolean;
  critical_finding: boolean;
  weekly_digest: boolean;
  findings_resolved: boolean;
};

type OrgSettings = {
  retention?: {
    analysisMonths: number;
    auditLogMonths: number;
    deleteRepoContentAfterAnalysis: boolean;
  };
  branding?: {
    logoUrl?: string;
    companyName?: string;
    hideAttribution?: boolean;
  };
  ghe?: {
    baseUrl: string;
    connectedAs?: string;
  };
  [key: string]: unknown;
};

export default async function TeamSettingsPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      plan: true,
      stripeCustomerId: true,
      slackTeamId: true,
      slackChannelName: true,
      slackConfig: true,
      settings: true,
      outboundWebhooks: {
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          enabled: true,
          createdAt: true,
          _count: { select: { deliveries: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!org) redirect("/dashboard");

  const connected = !!org.slackTeamId;
  const config = org.slackConfig as SlackConfig | null;

  const webhooks = org.outboundWebhooks.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
  }));

  const orgSettings = (org.settings ?? {}) as OrgSettings;
  const retentionPolicy = orgSettings.retention ?? {
    analysisMonths: 12,
    auditLogMonths: 84,
    deleteRepoContentAfterAnalysis: false,
  };
  const brandingSettings = orgSettings.branding ?? {};
  const gheState = {
    configured: !!orgSettings.ghe,
    baseUrl: orgSettings.ghe?.baseUrl ?? "",
    connectedAs: orgSettings.ghe?.connectedAs ?? "",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">Team Settings</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Integrations and notifications</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <TeamBilling plan={org.plan} hasStripeCustomer={!!org.stripeCustomerId} />
        <InvoiceBilling plan={org.plan} />
        <SlackSettings connected={connected} channelName={org.slackChannelName} config={config} />
        <WebhookManager initial={webhooks} />
        <RetentionSettings plan={org.plan} initial={retentionPolicy} />
        <WhiteLabelSettings plan={org.plan} initial={brandingSettings} orgName={org.name ?? ""} />
        <GHESettings plan={org.plan} initial={gheState} />
      </div>
    </div>
  );
}
