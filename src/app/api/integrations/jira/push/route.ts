import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getJiraAccessToken, createJiraIssue } from "@/lib/jira";
import { env } from "@/env";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const settings = (user.settings as Record<string, unknown>) ?? {};

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    findingId,
    jiraProjectKey,
    issueType = "Task",
  } = body as {
    findingId?: string;
    jiraProjectKey?: string;
    issueType?: string;
  };

  if (!findingId || !jiraProjectKey) {
    return Response.json({ error: "findingId and jiraProjectKey are required" }, { status: 400 });
  }

  const finding = await db.finding.findFirst({
    where: { id: findingId, project: { userId: user.id } },
    select: {
      id: true,
      title: true,
      description: true,
      recommendation: true,
      severity: true,
      metadata: true,
    },
  });

  if (!finding) {
    return Response.json({ error: "Finding not found" }, { status: 404 });
  }

  let accessToken: string;
  let cloudId: string;
  try {
    ({ accessToken, cloudId } = await getJiraAccessToken(user.id, settings));
  } catch {
    return Response.json({ error: "Jira not connected" }, { status: 403 });
  }

  const description = [
    finding.description,
    finding.recommendation ? `\nRecommendation: ${finding.recommendation}` : null,
    `\nSource: ${env.NEXT_PUBLIC_APP_URL}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const issue = await createJiraIssue(accessToken, cloudId, {
      projectKey: jiraProjectKey,
      issueType,
      title: finding.title,
      description,
      severity: finding.severity,
    });

    const existingMeta = (finding.metadata as Record<string, unknown>) ?? {};
    await db.finding.update({
      where: { id: finding.id },
      data: {
        metadata: {
          ...existingMeta,
          jiraIssueKey: issue.key,
          jiraIssueUrl: `https://api.atlassian.com/ex/jira/${cloudId}/browse/${issue.key}`,
          pushedToJiraAt: new Date().toISOString(),
        },
      },
    });

    return Response.json({ issueKey: issue.key, issueUrl: issue.self }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Push failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}
