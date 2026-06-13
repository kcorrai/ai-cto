import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  whiteLabelEnabled: z.boolean().optional(),
  customDomain: z.string().max(253).optional().nullable(),
  branding: z
    .object({
      companyName: z.string().max(100).optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      hideAttribution: z.boolean().optional(),
    })
    .optional(),
});

async function getOrgWithAdminCheck(userId: string, orgId: string) {
  return db.organizationMember.findFirst({
    where: {
      userId,
      organizationId: orgId,
      role: { in: ["owner", "admin"] },
    },
    select: { organizationId: true },
  });
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const membership = await getOrgWithAdminCheck(user.id, orgId);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, plan: true, settings: true },
  });

  return NextResponse.json({ config: org?.settings ?? {} });
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, plan: true, settings: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json(
      { error: "Enterprise plan required for white-label" },
      { status: 403 }
    );
  }

  const membership = await getOrgWithAdminCheck(user.id, orgId);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const result = UpdateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const existing = (org.settings as Record<string, unknown>) ?? {};
  const updated = await db.organization.update({
    where: { id: orgId },
    data: {
      settings: {
        ...existing,
        ...(result.data.whiteLabelEnabled !== undefined
          ? { whiteLabelEnabled: result.data.whiteLabelEnabled }
          : {}),
        ...(result.data.customDomain !== undefined
          ? { customDomain: result.data.customDomain }
          : {}),
        ...(result.data.branding
          ? { branding: { ...((existing.branding as object) ?? {}), ...result.data.branding } }
          : {}),
      },
    },
    select: { id: true, settings: true },
  });

  return NextResponse.json({ config: updated.settings });
}
