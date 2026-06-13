import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerAnalysis } from "@/lib/queue/analysis";

// Enterprise: trigger analysis across all org member projects
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, plan: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, plan: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.id, organizationId: orgId, role: { in: ["owner", "admin"] } },
    select: { organizationId: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all active projects in the org
  const projects = await db.project.findMany({
    where: { organizationId: orgId, status: "active" },
    select: { id: true, userId: true, name: true },
  });

  if (projects.length === 0) {
    return NextResponse.json({ triggered: 0, analysisIds: [] });
  }

  // Cap at 20 to avoid runaway costs
  const batch = projects.slice(0, 20);
  const results: { projectId: string; analysisId: string }[] = [];

  for (const project of batch) {
    try {
      const analysisId = await triggerAnalysis(project.id, project.userId, "manual");
      results.push({ projectId: project.id, analysisId });
    } catch {
      // Skip projects that fail (e.g., cooldown)
    }
  }

  return NextResponse.json({ triggered: results.length, analysisIds: results });
}
