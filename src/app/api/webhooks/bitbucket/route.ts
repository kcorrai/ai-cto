import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-event-key");

  if (event !== "repo:push") {
    return NextResponse.json({ skipped: true });
  }

  const payload = (await req.json()) as {
    repository?: { full_name?: string };
  };

  const fullName = payload.repository?.full_name;
  if (!fullName) {
    return NextResponse.json({ error: "No repository in payload" }, { status: 400 });
  }

  const projects = await db.project.findMany({
    where: {
      githubUrl: { contains: fullName },
      status: "active",
    },
    select: { id: true, userId: true },
  });

  if (projects.length === 0) {
    return NextResponse.json({ skipped: true });
  }

  const triggered: string[] = [];
  for (const project of projects) {
    try {
      const { triggerAnalysis } = await import("@/lib/queue/analysis");
      await triggerAnalysis(project.id, project.userId, "webhook");
      triggered.push(project.id);
    } catch {
      // May already be running
    }
  }

  return NextResponse.json({ triggered });
}
