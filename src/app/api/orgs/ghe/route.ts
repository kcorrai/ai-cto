import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

const GheConfigSchema = z.object({
  baseUrl: z.string().url(),
  personalAccessToken: z.string().min(1),
});

type OrgSettings = {
  ghe?: {
    baseUrl: string;
    personalAccessToken: string;
  };
  [key: string]: unknown;
};

export async function GET(_req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { plan: true, settings: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const settings = (org.settings ?? {}) as OrgSettings;
  return NextResponse.json({
    configured: !!settings.ghe,
    baseUrl: settings.ghe?.baseUrl,
    // Never return the token
  });
}

export async function PUT(req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, plan: true, settings: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = GheConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify the PAT works before storing
  const testUrl = `${parsed.data.baseUrl.replace(/\/$/, "")}/api/v3/user`;
  const testRes = await fetch(testUrl, {
    headers: {
      Authorization: `token ${parsed.data.personalAccessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!testRes.ok) {
    return NextResponse.json(
      { error: "Could not reach GitHub Enterprise Server with provided PAT" },
      { status: 400 }
    );
  }

  const gheUser = (await testRes.json()) as { login?: string };

  const settings = (org.settings ?? {}) as OrgSettings;
  const newSettings: Record<string, unknown> = {
    ...(settings as Record<string, unknown>),
    ghe: {
      baseUrl: parsed.data.baseUrl.replace(/\/$/, ""),
      personalAccessToken: encrypt(parsed.data.personalAccessToken),
      connectedAs: gheUser.login,
    },
  };

  await db.organization.update({
    where: { id: org.id },
    data: { settings: JSON.parse(JSON.stringify(newSettings)) },
  });

  return NextResponse.json({
    configured: true,
    baseUrl: parsed.data.baseUrl,
    connectedAs: gheUser.login,
  });
}

export async function DELETE(_req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, plan: true, settings: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ghe: _g, ...rest } = (org.settings ?? {}) as OrgSettings;
  await db.organization.update({
    where: { id: org.id },
    data: { settings: JSON.parse(JSON.stringify(rest)) },
  });

  return NextResponse.json({ ok: true });
}
