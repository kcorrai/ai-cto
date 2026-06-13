import { db } from "@/lib/db";

export type WhiteLabelBranding = {
  orgId: string;
  orgName: string;
  logoUrl: string | undefined;
  companyName: string | undefined;
  primaryColor: string | undefined;
  hideAttribution: boolean;
  customDomain: string | undefined;
};

type OrgSettings = {
  whiteLabelEnabled?: boolean;
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    hideAttribution?: boolean;
  };
};

export async function resolveWhiteLabelByHostname(
  hostname: string
): Promise<WhiteLabelBranding | null> {
  // Strip port and www
  const host = hostname.replace(/^www\./, "").split(":")[0] ?? hostname;

  const orgs = await db.organization.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, settings: true },
  });

  for (const org of orgs) {
    const settings = org.settings as OrgSettings | null;
    if (!settings?.whiteLabelEnabled) continue;
    if (settings.customDomain?.toLowerCase() === host.toLowerCase()) {
      return {
        orgId: org.id,
        orgName: org.name,
        logoUrl: settings.branding?.logoUrl,
        companyName: settings.branding?.companyName ?? org.name,
        primaryColor: settings.branding?.primaryColor,
        hideAttribution: settings.branding?.hideAttribution ?? false,
        customDomain: settings.customDomain,
      };
    }
  }

  return null;
}

export async function getOrgWhiteLabelConfig(orgId: string): Promise<WhiteLabelBranding | null> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, settings: true },
  });
  if (!org) return null;

  const settings = org.settings as OrgSettings | null;
  return {
    orgId: org.id,
    orgName: org.name,
    logoUrl: settings?.branding?.logoUrl,
    companyName: settings?.branding?.companyName ?? org.name,
    primaryColor: settings?.branding?.primaryColor,
    hideAttribution: settings?.branding?.hideAttribution ?? false,
    customDomain: settings?.customDomain,
  };
}
