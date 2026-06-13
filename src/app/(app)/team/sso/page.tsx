import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SSOSettings } from "@/components/team/SSOSettings";
import { ScimSettings } from "@/components/team/ScimSettings";
import { env } from "@/env";

type SamlConnection = {
  id: string;
  name: string;
  domain: string;
  provider: string;
  active: boolean;
  acsUrl: string;
  spEntityId: string;
  spMetadataUrl: string;
  idpMetadataUrl?: string;
};

type ClerkClientWithSaml = {
  samlConnections: {
    getSamlConnectionList: (params: object) => Promise<{ data: SamlConnection[] }>;
  };
};

export default async function SSOPage() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) redirect("/team");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, plan: true, settings: true },
  });
  if (!org) redirect("/dashboard");

  let connections: SamlConnection[] = [];
  if (org.plan === "enterprise") {
    try {
      const settings = org.settings as { samlConnectionIds?: string[] } | null;
      const ids = settings?.samlConnectionIds ?? [];
      if (ids.length > 0) {
        const client = await clerkClient();
        const { data: all } = await (
          client as unknown as ClerkClientWithSaml
        ).samlConnections.getSamlConnectionList({});
        connections = all.filter((c) => ids.includes(c.id));
      }
    } catch {
      // Clerk SAML not available — show empty state
    }
  }

  const settings = org.settings as { scimToken?: string } | null;
  const hasScimToken = !!settings?.scimToken;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">SSO & Provisioning</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          Configure single sign-on and automated user provisioning
        </p>
      </div>
      <div className="max-w-2xl space-y-8">
        <SSOSettings plan={org.plan} initialConnections={connections} />
        <ScimSettings plan={org.plan} hasToken={hasScimToken} appUrl={env.NEXT_PUBLIC_APP_URL} />
      </div>
    </div>
  );
}
