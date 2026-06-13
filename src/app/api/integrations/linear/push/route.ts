import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { createLinearIssue } from "@/lib/linear";
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
  const encryptedToken = settings.linearAccessToken as string | undefined;
  if (!encryptedToken) {
    return Response.json({ error: "Linear not connected" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { findingIds, teamId, projectId } = body as {
    findingIds?: string[];
    teamId?: string;
    projectId?: string;
  };

  if (!findingIds?.length || !teamId) {
    return Response.json({ error: "findingIds and teamId are required" }, { status: 400 });
  }

  const findings = await db.finding.findMany({
    where: { id: { in: findingIds }, project: { userId: user.id } },
    select: {
      id: true,
      title: true,
      description: true,
      recommendation: true,
      severity: true,
      module: true,
      analysisId: true,
      metadata: true,
    },
  });

  if (findings.length === 0) {
    return Response.json({ error: "No valid findings found" }, { status: 404 });
  }

  const token = decrypt(encryptedToken);
  const results: { findingId: string; issueId: string; issueUrl: string }[] = [];

  for (const finding of findings) {
    const description = [
      finding.description,
      finding.recommendation ? `\n**Recommendation:** ${finding.recommendation}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const sourceUrl = `${env.NEXT_PUBLIC_APP_URL}/projects`;

    const issue = await createLinearIssue(token, {
      teamId,
      ...(projectId ? { projectId } : {}),
      title: finding.title,
      description,
      severity: finding.severity,
      sourceUrl,
    });

    const existingMeta = (finding.metadata as Record<string, unknown>) ?? {};
    await db.finding.update({
      where: { id: finding.id },
      data: {
        metadata: {
          ...existingMeta,
          linearIssueId: issue.id,
          linearIssueUrl: issue.url,
          linearIssueIdentifier: issue.identifier,
          pushedToLinearAt: new Date().toISOString(),
        },
      },
    });

    results.push({ findingId: finding.id, issueId: issue.id, issueUrl: issue.url });
  }

  return Response.json({ results }, { status: 201 });
}
