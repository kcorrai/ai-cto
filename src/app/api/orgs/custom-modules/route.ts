import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(10).max(10000),
  outputSchema: z.record(z.unknown()).optional(),
});

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: { id: true, plan: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const modules = await db.customModule.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ modules });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireOrgPermission("org:settings");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgCtx.clerkOrgId },
    select: { id: true, plan: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.customModule.count({ where: { organizationId: org.id } });
  if (existing >= 20) {
    return NextResponse.json(
      { error: "Maximum 20 custom modules per organization" },
      { status: 400 }
    );
  }

  const customModule = await db.customModule.create({
    data: {
      organizationId: org.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      prompt: parsed.data.prompt,
      outputSchema: (parsed.data.outputSchema ?? {}) as never,
    },
  });

  return NextResponse.json(customModule, { status: 201 });
}
