import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  const now = new Date();
  const months = parseInt(url.searchParams.get("months") ?? "3", 10);
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // Per-user breakdown
  const userUsage = await db.analysis.groupBy({
    by: ["triggeredById"],
    where: {
      project: { organizationId: org.id },
      createdAt: { gte: startDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const userIds = userUsage.map((u) => u.triggeredById);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Per-project breakdown
  const projectUsage = await db.analysis.groupBy({
    by: ["projectId"],
    where: {
      project: { organizationId: org.id },
      createdAt: { gte: startDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const projectIds = projectUsage.map((p) => p.projectId);
  const projects = await db.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Monthly totals
  const monthlyBuckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await db.analysis.count({
      where: {
        project: { organizationId: org.id },
        createdAt: { gte: start, lt: end },
      },
    });
    monthlyBuckets.push({
      month: start.toLocaleString("en-US", { month: "short", year: "numeric" }),
      analyses: count,
    });
  }

  const totalMembers = await db.organizationMember.count({ where: { organizationId: org.id } });

  const report = {
    period: { from: startDate.toISOString(), to: now.toISOString(), months },
    totalMembers,
    totalAnalyses: userUsage.reduce((s, u) => s + u._count.id, 0),
    monthlyTrend: monthlyBuckets,
    byUser: userUsage.map((u) => ({
      userId: u.triggeredById,
      name: userMap.get(u.triggeredById)?.name ?? null,
      email: userMap.get(u.triggeredById)?.email ?? "Unknown",
      analyses: u._count.id,
    })),
    byProject: projectUsage.map((p) => ({
      projectId: p.projectId,
      name: projectMap.get(p.projectId)?.name ?? "Unknown",
      analyses: p._count.id,
    })),
  };

  if (format === "csv") {
    const rows = [
      ["user_email", "user_name", "analyses"],
      ...report.byUser.map((u) => [u.email, u.name ?? "", String(u.analyses)]),
    ]
      .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="usage-report-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
