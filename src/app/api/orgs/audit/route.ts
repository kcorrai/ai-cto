import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, plan: true },
  });
  if (!org || org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const action = url.searchParams.get("action");
  const resource = url.searchParams.get("resource");
  const userId2 = url.searchParams.get("userId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fmt = url.searchParams.get("format");

  const where = buildWhere(org.id, { action, resource, userId2, from, to });

  if (fmt === "csv") {
    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000,
      include: { user: { select: { email: true, name: true } } },
    });

    const header = [
      "timestamp",
      "action",
      "resource",
      "resource_id",
      "resource_name",
      "user_email",
      "ip",
    ];
    const dataRows = logs.map((l) => [
      l.createdAt.toISOString(),
      l.action,
      l.resource ?? "",
      l.resourceId ?? "",
      l.resourceName ?? "",
      l.user.email,
      l.ipAddress ?? "",
    ]);
    const rows = [header, ...dataRows]
      .map((row) => row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.csv"`,
      },
    });
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize: PAGE_SIZE });
}

function buildWhere(
  organizationId: string,
  filters: {
    action: string | null;
    resource: string | null;
    userId2: string | null;
    from: string | null;
    to: string | null;
  }
) {
  return {
    organizationId,
    ...(filters.action
      ? { action: { contains: filters.action, mode: "insensitive" as const } }
      : {}),
    ...(filters.resource ? { resource: filters.resource } : {}),
    ...(filters.userId2 ? { userId: filters.userId2 } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  };
}
