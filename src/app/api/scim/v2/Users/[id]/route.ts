import { db } from "@/lib/db";
import { authenticateScim } from "@/lib/scim/auth";
import {
  SCIM_USER_SCHEMA,
  scimError,
  scimJson,
  type ScimUser,
  type ScimPatchOp,
} from "@/lib/scim/types";
import { env } from "@/env";

function userToScim(user: {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ScimUser {
  const nameParts = user.name?.split(" ") ?? [];
  const lastName = nameParts.slice(1).join(" ");
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  return {
    schemas: [SCIM_USER_SCHEMA],
    id: user.id,
    userName: user.email,
    name: {
      ...(user.name ? { formatted: user.name } : {}),
      ...(nameParts[0] ? { givenName: nameParts[0] } : {}),
      ...(lastName ? { familyName: lastName } : {}),
    },
    emails: [{ value: user.email, primary: true, type: "work" }],
    active: !user.deletedAt,
    meta: {
      resourceType: "User",
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt.toISOString(),
      location: `${baseUrl}/api/scim/v2/Users/${user.id}`,
    },
  };
}

async function getOrgUser(organizationId: string, userId: string) {
  const member = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });
  return member?.user ?? null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(_req);
  if (!ctx) return scimError("Unauthorized", 401);

  const user = await getOrgUser(ctx.organizationId, id);
  if (!user) return scimError("User not found", 404);

  return scimJson(userToScim(user));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const user = await getOrgUser(ctx.organizationId, id);
  if (!user) return scimError("User not found", 404);

  const body = (await req.json()) as {
    name?: { givenName?: string; familyName?: string };
    active?: boolean;
  };

  const firstName = body.name?.givenName ?? "";
  const lastName = body.name?.familyName ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || null;

  const updated = await db.user.update({
    where: { id },
    data: {
      name,
      deletedAt: body.active === false ? new Date() : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  // Remove from org if deprovisioned
  if (body.active === false) {
    await db.organizationMember.deleteMany({
      where: { organizationId: ctx.organizationId, userId: id },
    });
  }

  return scimJson(userToScim(updated));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const user = await getOrgUser(ctx.organizationId, id);
  if (!user) return scimError("User not found", 404);

  const body = (await req.json()) as ScimPatchOp;
  let deactivate = false;
  let reactivate = false;
  let newName: string | null = user.name;

  for (const op of body.Operations ?? []) {
    const path = op.path?.toLowerCase();
    if (path === "active") {
      if (op.value === false || op.value === "false") deactivate = true;
      else if (op.value === true || op.value === "true") reactivate = true;
    }
    if (path === "name.givenname" || path === "name.familyname") {
      const parts = newName?.split(" ") ?? ["", ""];
      if (path === "name.givenname") parts[0] = String(op.value ?? "");
      else parts[1] = String(op.value ?? "");
      newName = parts.filter(Boolean).join(" ") || null;
    }
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      name: newName,
      ...(deactivate ? { deletedAt: new Date() } : {}),
      ...(reactivate ? { deletedAt: null } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  if (deactivate) {
    await db.organizationMember.deleteMany({
      where: { organizationId: ctx.organizationId, userId: id },
    });
  }

  return scimJson(userToScim(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticateScim(_req);
  if (!ctx) return scimError("Unauthorized", 401);

  const user = await getOrgUser(ctx.organizationId, id);
  if (!user) return scimError("User not found", 404);

  // Remove from org (soft delete user)
  await Promise.all([
    db.organizationMember.deleteMany({ where: { organizationId: ctx.organizationId, userId: id } }),
    db.user.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);

  return new Response(null, { status: 204 });
}
