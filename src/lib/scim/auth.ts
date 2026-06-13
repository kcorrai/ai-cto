import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export type ScimContext = {
  organizationId: string;
  clerkOrgId: string;
};

export async function authenticateScim(req: Request): Promise<ScimContext | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // Token format: "scim_{orgId}_{random}" — prefix lets us find the org without full scan
  const parts = token.split("_");
  if (parts.length < 3 || parts[0] !== "scim") return null;

  const orgId = parts[1]!;

  const org = await db.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: { id: true, clerkOrgId: true, settings: true, plan: true },
  });
  if (!org || org.plan !== "enterprise") return null;

  const settings = org.settings as { scimToken?: string } | null;
  if (!settings?.scimToken) return null;

  let storedToken: string;
  try {
    storedToken = decrypt(settings.scimToken);
  } catch {
    return null;
  }

  if (storedToken !== token) return null;

  return { organizationId: org.id, clerkOrgId: org.clerkOrgId };
}
