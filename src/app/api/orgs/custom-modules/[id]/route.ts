import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveOrg } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/auth/permissions";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  prompt: z.string().min(10).max(10000).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

async function getOrgModule(clerkOrgId: string, moduleId: string) {
  const org = await db.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true, plan: true },
  });
  if (!org || org.plan !== "enterprise") return null;

  return db.customModule.findFirst({
    where: { id: moduleId, organizationId: org.id },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const { id } = await params;
  const customModule = await getOrgModule(orgCtx.clerkOrgId, id);
  if (!customModule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(customModule);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireOrgPermission("org:settings");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const { id } = await params;
  const customModule = await getOrgModule(orgCtx.clerkOrgId, id);
  if (!customModule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, description, prompt, outputSchema, enabled } = parsed.data;
  const updated = await db.customModule.update({
    where: { id: customModule.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(prompt !== undefined ? { prompt } : {}),
      ...(outputSchema !== undefined ? { outputSchema: outputSchema as never } : {}),
      ...(enabled !== undefined ? { enabled } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requireOrgPermission("org:settings");

  const orgCtx = await getActiveOrg();
  if (!orgCtx) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const { id } = await params;
  const customModule = await getOrgModule(orgCtx.clerkOrgId, id);
  if (!customModule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.customModule.delete({ where: { id: customModule.id } });

  return new NextResponse(null, { status: 204 });
}
