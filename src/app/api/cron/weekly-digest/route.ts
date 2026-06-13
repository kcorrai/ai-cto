import { createElement } from "react";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { WeeklyDigestEmail, type DigestProject } from "@/emails/WeeklyDigestEmail";
import { env } from "@/env";

// Vercel cron: schedule in vercel.json — every Monday 08:00 UTC
// Header CRON_SECRET guards against unauthorized invocations
export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.ENCRYPTION_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const users = await db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      projects: {
        where: { status: { not: "deleted" } },
        select: {
          id: true,
          githubOwner: true,
          githubRepo: true,
          name: true,
          analyses: {
            where: { status: "complete" },
            orderBy: { completedAt: "desc" },
            take: 2,
            select: {
              id: true,
              score: true,
              completedAt: true,
              _count: { select: { findingRecords: true } },
            },
          },
        },
      },
    },
  });

  const weekOf = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let sent = 0;

  for (const user of users) {
    if (!user.email) continue;

    const projects: DigestProject[] = user.projects.map((p) => {
      const [latest, previous] = p.analyses;
      return {
        name: p.name,
        repoName: `${p.githubOwner}/${p.githubRepo}`,
        score: latest?.score ?? null,
        previousScore: previous?.score ?? null,
        findingCount: latest?._count.findingRecords ?? 0,
        analysisId: latest?.id ?? null,
        projectId: p.id,
      };
    });

    const element = createElement(WeeklyDigestEmail, {
      name: user.name ?? user.email,
      appUrl: env.NEXT_PUBLIC_APP_URL,
      weekOf,
      projects,
    });

    await sendEmail({
      to: user.email,
      subject: `Your AI CTO weekly digest — ${weekOf}`,
      react: element,
    });
    sent++;
  }

  return Response.json({ sent });
}
