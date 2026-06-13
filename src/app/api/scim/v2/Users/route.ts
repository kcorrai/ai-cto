import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import { authenticateScim } from "@/lib/scim/auth";
import {
  SCIM_USER_SCHEMA,
  SCIM_LIST_SCHEMA,
  scimError,
  scimJson,
  type ScimUser,
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

export async function GET(req: Request) {
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const url = new URL(req.url);
  const startIndex = Math.max(1, parseInt(url.searchParams.get("startIndex") ?? "1", 10));
  const count = Math.min(100, parseInt(url.searchParams.get("count") ?? "100", 10));
  const filter = url.searchParams.get("filter");

  // Parse filter (e.g. userName eq "user@example.com")
  let emailFilter: string | undefined;
  if (filter) {
    const match = filter.match(/userName\s+eq\s+"([^"]+)"/i);
    if (match) emailFilter = match[1];
  }

  const members = await db.organizationMember.findMany({
    where: { organizationId: ctx.organizationId },
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
    skip: startIndex - 1,
    take: count,
  });

  let users = members.map((m) => m.user);
  if (emailFilter) {
    users = users.filter((u) => u.email.toLowerCase() === emailFilter!.toLowerCase());
  }

  const totalResults = await db.organizationMember.count({
    where: { organizationId: ctx.organizationId },
  });

  return scimJson({
    schemas: [SCIM_LIST_SCHEMA],
    totalResults: emailFilter ? users.length : totalResults,
    startIndex,
    itemsPerPage: count,
    Resources: users.map(userToScim),
  });
}

export async function POST(req: Request) {
  const ctx = await authenticateScim(req);
  if (!ctx) return scimError("Unauthorized", 401);

  const body = (await req.json()) as {
    userName?: string;
    name?: { givenName?: string; familyName?: string };
    emails?: Array<{ value: string; primary?: boolean }>;
    externalId?: string;
    active?: boolean;
  };

  const email =
    body.userName ?? body.emails?.find((e) => e.primary)?.value ?? body.emails?.[0]?.value;
  if (!email) return scimError("userName or emails[primary] is required", 400);

  const firstName = body.name?.givenName ?? "";
  const lastName = body.name?.familyName ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || null;

  // Check if user already exists
  let user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  if (!user) {
    // Create user in Clerk and our DB via invitation
    try {
      const client = await clerkClient();
      await client.organizations.createOrganizationInvitation({
        organizationId: ctx.clerkOrgId,
        emailAddress: email,
        role: "org:member",
        redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
        inviterUserId:
          (await client.organizations.getOrganization({ organizationId: ctx.clerkOrgId }))
            .createdBy ?? "",
      });
    } catch {
      // Invitation may fail if user already has a Clerk account — that's OK
    }

    // Create DB record
    user = await db.user.create({
      data: { email: email.toLowerCase(), name, clerkId: `scim_pending_${Date.now()}` },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  // Add to org if not already a member
  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: ctx.organizationId, userId: user.id } },
    create: { organizationId: ctx.organizationId, userId: user.id, role: "viewer" },
    update: {},
  });

  return scimJson(userToScim(user), 201);
}
