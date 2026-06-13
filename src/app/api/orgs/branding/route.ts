import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

type OrgSettings = {
  samlConnectionIds?: string[];
  scimToken?: string;
  retention?: Record<string, unknown>;
  branding?: {
    logoUrl?: string;
    companyName?: string;
    hideAttribution?: boolean;
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
    select: { plan: true, settings: true, name: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const settings = (org.settings ?? {}) as OrgSettings;
  return NextResponse.json({
    branding: settings.branding ?? {},
    orgName: org.name,
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

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    // Logo upload
    const formData = await req.formData();
    const file = formData.get("logo");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo must be under 2MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "png";
    const blob = await put(`org-logos/${org.id}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });

    const settings = (org.settings ?? {}) as OrgSettings;
    const newSettings: Record<string, unknown> = {
      ...(settings as Record<string, unknown>),
      branding: { ...(settings.branding ?? {}), logoUrl: blob.url },
    };
    const updated = await db.organization.update({
      where: { id: org.id },
      data: { settings: JSON.parse(JSON.stringify(newSettings)) },
      select: { settings: true },
    });

    const updatedSettings = (updated.settings ?? {}) as OrgSettings;
    return NextResponse.json({ branding: updatedSettings.branding });
  }

  // JSON: update company name / attribution flag
  const body = (await req.json()) as {
    companyName?: string;
    hideAttribution?: boolean;
  };

  const settings = (org.settings ?? {}) as OrgSettings;
  const newBranding: Record<string, unknown> = {
    ...(settings.branding ?? {}),
    ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
    ...(body.hideAttribution !== undefined ? { hideAttribution: body.hideAttribution } : {}),
  };
  const newSettings: Record<string, unknown> = {
    ...(settings as Record<string, unknown>),
    branding: newBranding,
  };
  const updated = await db.organization.update({
    where: { id: org.id },
    data: { settings: JSON.parse(JSON.stringify(newSettings)) },
    select: { settings: true },
  });

  const updatedSettings = (updated.settings ?? {}) as OrgSettings;
  return NextResponse.json({ branding: updatedSettings.branding });
}
