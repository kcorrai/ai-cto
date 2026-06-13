import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SSOSettings } from "@/components/team/SSOSettings";

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

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">Single Sign-On</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">Configure SAML 2.0 SSO for your organization</p>
      </div>
      <SSOSettings plan={org.plan} initialConnections={connections} />
    </div>
  );
}
