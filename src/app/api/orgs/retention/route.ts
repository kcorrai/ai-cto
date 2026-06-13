import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const RetentionSchema = z.object({
  analysisMonths: z.number().int().min(1).max(84),
  auditLogMonths: z.number().int().min(1).max(84),
  deleteRepoContentAfterAnalysis: z.boolean(),
});

type OrgSettings = {
  samlConnectionIds?: string[];
  scimToken?: string;
  retention?: z.infer<typeof RetentionSchema>;
  [key: string]: unknown;
};

export async function GET(_req: Request) {
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

  const settings = (org.settings ?? {}) as OrgSettings;
  const retention = settings.retention ?? {
    analysisMonths: 12,
    auditLogMonths: 84,
    deleteRepoContentAfterAnalysis: false,
  };

  return NextResponse.json({ retention });
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
  const parsed = RetentionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = (org.settings ?? {}) as OrgSettings;
  const updated = await db.organization.update({
    where: { id: org.id },
    data: { settings: { ...settings, retention: parsed.data } },
    select: { settings: true },
  });

  const newSettings = (updated.settings ?? {}) as OrgSettings;
  return NextResponse.json({ retention: newSettings.retention });
}
