import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHmac } from "crypto";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-gitlab-event");
  const token = req.headers.get("x-gitlab-token");

  // Verify secret token if configured
  const body = await req.text();
  if (env.GITLAB_WEBHOOK_SECRET) {
    const expected = createHmac("sha256", env.GITLAB_WEBHOOK_SECRET).update(body).digest("hex");
    if (token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (event !== "Push Hook") {
    return NextResponse.json({ skipped: true });
  }

  const payload = JSON.parse(body) as {
    project?: { id?: number; path_with_namespace?: string };
  };

  const projectPath = payload.project?.path_with_namespace;

  if (!projectPath) {
    return NextResponse.json({ error: "No project path in payload" }, { status: 400 });
  }

  // Find projects with this GitLab URL (stored in githubUrl for provider-agnostic repos)
  const projects = await db.project.findMany({
    where: {
      githubUrl: { contains: projectPath },
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
      // Project may already have an analysis running
    }
  }

  return NextResponse.json({ triggered });
}
