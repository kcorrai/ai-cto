import { db } from "@/lib/db";
import { authenticateScim } from "@/lib/scim/auth";
import {
  SCIM_GROUP_SCHEMA,
  scimError,
  scimJson,
  type ScimGroup,
  type ScimPatchOp,
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

async function buildGroup(
  orgId: string,
  id: string,
  displayName: string,
  role: string,
  baseUrl: string
): Promise<ScimGroup> {
  const members = await db.organizationMember.findMany({
    where: { organizationId: orgId, role: role as "admin" | "editor" | "viewer" | "owner" },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
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

function parseGroupId(rawId: string): { displayName: string; role: string } | null {
  const colonIdx = rawId.lastIndexOf(":");
  const displayName = colonIdx > 0 ? rawId.slice(colonIdx + 1) : rawId;
  const role = ROLE_MAP[displayName.toLowerCase()];
  if (!role) return null;
  const canonical = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
  return { displayName: canonical, role };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(_req);
  if (!ctx) return scimError("Unauthorized", 401);

  const parsed = parseGroupId(decodeURIComponent(id));
  if (!parsed) return scimError("Group not found", 404);

  const group = await buildGroup(
    ctx.organizationId,
    id,
    parsed.displayName,
    parsed.role,
    env.NEXT_PUBLIC_APP_URL
  );
  return scimJson(group);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const parsed = parseGroupId(decodeURIComponent(id));
  if (!parsed) return scimError("Group not found", 404);

  const body = (await req.json()) as { members?: Array<{ value: string }> };
  const memberIds = body.members?.map((m) => m.value) ?? [];

  // Replace all members of this role
  await db.organizationMember.deleteMany({
    where: {
      organizationId: ctx.organizationId,
      role: parsed.role as "admin" | "editor" | "viewer",
    },
  });

  for (const userId of memberIds) {
    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: ctx.organizationId, userId } },
      create: {
        organizationId: ctx.organizationId,
        userId,
        role: parsed.role as "admin" | "editor" | "viewer",
      },
      update: { role: parsed.role as "admin" | "editor" | "viewer" },
    });
  }

  const group = await buildGroup(
    ctx.organizationId,
    id,
    parsed.displayName,
    parsed.role,
    env.NEXT_PUBLIC_APP_URL
  );
  return scimJson(group);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const parsed = parseGroupId(decodeURIComponent(id));
  if (!parsed) return scimError("Group not found", 404);

  const body = (await req.json()) as ScimPatchOp;

  for (const op of body.Operations ?? []) {
    const path = op.path?.toLowerCase() ?? "";

    if (op.op === "add" && path === "members") {
      const members = Array.isArray(op.value) ? (op.value as Array<{ value: string }>) : [];
      for (const m of members) {
        await db.organizationMember.upsert({
          where: { organizationId_userId: { organizationId: ctx.organizationId, userId: m.value } },
          create: {
            organizationId: ctx.organizationId,
            userId: m.value,
            role: parsed.role as "admin" | "editor" | "viewer",
          },
          update: { role: parsed.role as "admin" | "editor" | "viewer" },
        });
      }
    }

    if (op.op === "remove") {
      // Remove specific member: path = members[value eq "userId"]
      const match = path.match(/members\[value eq "([^"]+)"\]/);
      if (match?.[1]) {
        await db.organizationMember.deleteMany({
          where: { organizationId: ctx.organizationId, userId: match[1] },
        });
      }
    }
  }

  const group = await buildGroup(
    ctx.organizationId,
    id,
    parsed.displayName,
    parsed.role,
    env.NEXT_PUBLIC_APP_URL
  );
  return scimJson(group);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(_req);
  if (!ctx) return scimError("Unauthorized", 401);

  const parsed = parseGroupId(decodeURIComponent(id));
  if (!parsed) return scimError("Group not found", 404);

  // Remove all members from this role
  await db.organizationMember.deleteMany({
    where: {
      organizationId: ctx.organizationId,
      role: parsed.role as "admin" | "editor" | "viewer",
    },
  });

  return new Response(null, { status: 204 });
}
