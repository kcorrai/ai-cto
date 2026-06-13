import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/env";

type OrgSettings = {
  retention?: {
    analysisMonths: number;
    auditLogMonths: number;
    deleteRepoContentAfterAnalysis: boolean;
  };
  [key: string]: unknown;
};

// Called by Vercel Cron daily at 03:00 UTC
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await db.organization.findMany({
    where: { plan: "enterprise" },
    select: { id: true, settings: true },
  });

  let totalAnalysesDeleted = 0;
  let totalAuditLogsDeleted = 0;

  for (const org of orgs) {
    const settings = (org.settings ?? {}) as OrgSettings;
    const retention = settings.retention ?? {
      analysisMonths: 12,
      auditLogMonths: 84,
      deleteRepoContentAfterAnalysis: false,
    };

    const analysisCutoff = new Date();
    analysisCutoff.setMonth(analysisCutoff.getMonth() - retention.analysisMonths);

    const auditCutoff = new Date();
    auditCutoff.setMonth(auditCutoff.getMonth() - retention.auditLogMonths);

    const [analysisResult, auditResult] = await Promise.all([
      db.analysis.deleteMany({
        where: {
          project: { organizationId: org.id },
          createdAt: { lt: analysisCutoff },
        },
      }),
      db.auditLog.deleteMany({
        where: {
          organizationId: org.id,
          createdAt: { lt: auditCutoff },
        },
      }),
    ]);

    totalAnalysesDeleted += analysisResult.count;
    totalAuditLogsDeleted += auditResult.count;
  }

  return NextResponse.json({
    ok: true,
    deleted: { analyses: totalAnalysesDeleted, auditLogs: totalAuditLogsDeleted },
  });
}
