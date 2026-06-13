import { db } from "@/lib/db";
import { authenticateScim } from "@/lib/scim/auth";
import {
  SCIM_GROUP_SCHEMA,
  SCIM_LIST_SCHEMA,
  scimError,
  scimJson,
  type ScimGroup,
} from "@/lib/scim/types";
import { env } from "@/env";

const ROLE_MAP: Record<string, string> = {
  admins: "admin",
  admin: "admin",
  editors: "editor",
  editor: "editor",
  viewers: "viewer",
  viewer: "viewer",
};

function groupId(orgId: string, roleName: string) {
  return `${orgId}:${roleName}`;
}

async function buildGroup(
  orgId: string,
  displayName: string,
  role: string,
  baseUrl: string
): Promise<ScimGroup> {
  const members = await db.organizationMember.findMany({
    where: { organizationId: orgId, role: role as "admin" | "editor" | "viewer" | "owner" },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });

  const id = groupId(orgId, displayName.toLowerCase());
  return {
    schemas: [SCIM_GROUP_SCHEMA],
    id,
    displayName,
    members: members.map((m) => ({
      value: m.userId,
      display: m.user.name ?? m.user.email,
    })),
    meta: {
      resourceType: "Group",
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      location: `${baseUrl}/api/scim/v2/Groups/${encodeURIComponent(id)}`,
    },
  };
}

export async function GET(req: Request) {
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const groups = await Promise.all([
    buildGroup(ctx.organizationId, "Admins", "admin", baseUrl),
    buildGroup(ctx.organizationId, "Editors", "editor", baseUrl),
    buildGroup(ctx.organizationId, "Viewers", "viewer", baseUrl),
  ]);

  return scimJson({
    schemas: [SCIM_LIST_SCHEMA],
    totalResults: groups.length,
    startIndex: 1,
    itemsPerPage: groups.length,
    Resources: groups,
  });
}

export async function POST(req: Request) {
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const body = (await req.json()) as {
    displayName?: string;
    members?: Array<{ value: string }>;
  };

  const displayName = body.displayName;
  if (!displayName) return scimError("displayName is required", 400);

  const role = ROLE_MAP[displayName.toLowerCase()] ?? "viewer";
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  // Add any included members to the org with this role
  if (body.members?.length) {
    for (const m of body.members) {
      await db.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: ctx.organizationId, userId: m.value } },
        create: {
          organizationId: ctx.organizationId,
          userId: m.value,
          role: role as "admin" | "editor" | "viewer",
        },
        update: { role: role as "admin" | "editor" | "viewer" },
      });
    }
  }

  const group = await buildGroup(ctx.organizationId, displayName, role, baseUrl);
  return scimJson(group, 201);
}
