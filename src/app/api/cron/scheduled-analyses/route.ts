import { db } from "@/lib/db";
import { triggerAnalysis } from "@/lib/queue/analysis";
import type { ScheduleFrequency } from "@prisma/client";

function nextRunDate(frequency: ScheduleFrequency): Date {
  const now = new Date();
  switch (frequency) {
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "biweekly":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "monthly":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const due = await db.scheduledAnalysis.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: new Date() },
    },
    select: {
      id: true,
      frequency: true,
      project: {
        select: { id: true, userId: true },
      },
    },
    take: 50,
  });

  let triggered = 0;
  await Promise.allSettled(
    due.map(async (s) => {
      try {
        await triggerAnalysis(s.project.id, s.project.userId, "scheduled");
        await db.scheduledAnalysis.update({
          where: { id: s.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: nextRunDate(s.frequency),
          },
        });
        triggered++;
      } catch {
        // Non-fatal: project may be locked or limit reached
      }
    })
  );

  return Response.json({ triggered, total: due.length });
}
