import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, plan: true },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalMembers, totalProjects, totalApiKeys, analysesThisMonth, criticalFindings, topUsers] =
    await Promise.all([
      db.organizationMember.count({ where: { organizationId: org.id } }),
      db.project.count({ where: { organizationId: org.id, status: "active", deletedAt: null } }),
      db.apiKey.count({
        where: { user: { orgMemberships: { some: { organizationId: org.id } } }, isActive: true },
      }),
      db.analysis.count({
        where: {
          project: { organizationId: org.id },
          createdAt: { gte: startOfMonth },
        },
      }),
      db.finding.count({
        where: {
          project: { organizationId: org.id },
          severity: "critical",
          isResolved: false,
        },
      }),
      db.analysis.groupBy({
        by: ["triggeredById"],
        where: {
          project: { organizationId: org.id },
          createdAt: { gte: startOfMonth },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

  // Get user details for top users
  const topUserIds = topUsers.map((u) => u.triggeredById);
  const userDetails = await db.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(userDetails.map((u) => [u.id, u]));

  return NextResponse.json({
    totalMembers,
    totalProjects,
    totalApiKeys,
    analysesThisMonth,
    criticalFindings,
    topUsers: topUsers.map((u) => ({
      userId: u.triggeredById,
      name: userMap.get(u.triggeredById)?.name ?? null,
      email: userMap.get(u.triggeredById)?.email ?? "Unknown",
      analyses: u._count.id,
    })),
  });
}
