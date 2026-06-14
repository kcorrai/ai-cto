import { encrypt, decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { env } from "@/env";
import type { Prisma } from "@prisma/client";

const JIRA_API_BASE = "https://api.atlassian.com";
const JIRA_TOKEN_URL = "https://auth.atlassian.com/oauth/token";

const SEVERITY_PRIORITY: Record<string, string> = {
  critical: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Low",
};

export async function refreshJiraToken(
  userId: string,
  encryptedRefreshToken: string
): Promise<{ accessToken: string; encryptedAccessToken: string }> {
  const clientId = env.JIRA_CLIENT_ID;
  const clientSecret = env.JIRA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Jira not configured");

  const refreshToken = decrypt(encryptedRefreshToken);
  const res = await fetch(JIRA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh Jira token");

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };

  const encryptedAccessToken = encrypt(data.access_token);
  const user = await db.user.findUnique({ where: { id: userId }, select: { settings: true } });
  const settings = (user?.settings as Record<string, unknown>) ?? {};
  const newSettings = {
    ...settings,
    jiraAccessToken: encryptedAccessToken,
    ...(data.refresh_token ? { jiraRefreshToken: encrypt(data.refresh_token) } : {}),
  };
  await db.user.update({
    where: { id: userId },
    data: { settings: newSettings as Prisma.InputJsonValue },
  });

  return { accessToken: data.access_token, encryptedAccessToken };
}

async function jiraFetch(
  accessToken: string,
  cloudId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${JIRA_API_BASE}/ex/jira/${cloudId}/rest/api/3${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
}

export async function getJiraProjects(
  accessToken: string,
  cloudId: string
): Promise<{ id: string; key: string; name: string }[]> {
  const res = await jiraFetch(accessToken, cloudId, "/project/search?maxResults=50");
  if (!res.ok) throw new Error("Failed to fetch Jira projects");
  const data = (await res.json()) as { values: { id: string; key: string; name: string }[] };
  return data.values;
}

export async function createJiraIssue(
  accessToken: string,
  cloudId: string,
  {
    projectKey,
    issueType,
    title,
    description,
    severity,
  }: {
    projectKey: string;
    issueType: string;
    title: string;
    description?: string;
    severity: string;
  }
): Promise<{ id: string; key: string; self: string }> {
  const priority = SEVERITY_PRIORITY[severity] ?? "Medium";

  const bodyContent = {
    type: "doc",
    version: 1,
    content: [
      ...(description
        ? [
            {
              type: "paragraph",
              content: [{ type: "text", text: description }],
            },
          ]
        : []),
      {
        type: "paragraph",
        content: [
          { type: "text", text: `Severity: ${severity} | Source: AI CTO`, marks: [{ type: "em" }] },
        ],
      },
    ],
  };

  const res = await jiraFetch(accessToken, cloudId, "/issue", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary: title,
        description: bodyContent,
        issuetype: { name: issueType },
        priority: { name: priority },
        labels: ["ai-cto", severity],
      },
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { errorMessages?: string[] };
    throw new Error(err.errorMessages?.[0] ?? "Failed to create Jira issue");
  }

  return res.json() as Promise<{ id: string; key: string; self: string }>;
}

export async function getJiraAccessToken(
  userId: string,
  settings: Record<string, unknown>
): Promise<{ accessToken: string; cloudId: string }> {
  const encryptedAccess = settings.jiraAccessToken as string | undefined;
  const encryptedRefresh = settings.jiraRefreshToken as string | undefined;
  const cloudId = settings.jiraCloudId as string | undefined;

  if (!encryptedAccess || !cloudId) throw new Error("Jira not connected");

  let accessToken: string;
  try {
    accessToken = decrypt(encryptedAccess);
  } catch {
    if (!encryptedRefresh) throw new Error("Jira token invalid");
    const refreshed = await refreshJiraToken(userId, encryptedRefresh);
    accessToken = refreshed.accessToken;
  }

  return { accessToken, cloudId };
}
