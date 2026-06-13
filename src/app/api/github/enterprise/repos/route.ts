import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

type OrgSettings = {
  ghe?: {
    baseUrl: string;
    personalAccessToken: string;
    connectedAs?: string;
  };
  [key: string]: unknown;
};

type GheRepo = {
  id: number;
  full_name: string;
  description: string | null;
  private: boolean;
  pushed_at: string;
  default_branch: string;
  html_url: string;
  language: string | null;
};

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { plan: true, settings: true },
  });

  if (!org || org.plan !== "enterprise") {
    return NextResponse.json({ error: "Enterprise plan required" }, { status: 403 });
  }

  const settings = (org.settings ?? {}) as OrgSettings;
  if (!settings.ghe?.personalAccessToken) {
    return NextResponse.json({ error: "GitHub Enterprise not configured" }, { status: 400 });
  }

  const token = decrypt(settings.ghe.personalAccessToken);
  const baseUrl = settings.ghe.baseUrl;

  const url = new URL(req.url);
  const page = url.searchParams.get("page") ?? "1";
  const search = url.searchParams.get("search") ?? "";

  const apiBase = `${baseUrl}/api/v3`;
  const endpoint = search
    ? `${apiBase}/search/repositories?q=${encodeURIComponent(search + ` user:${settings.ghe.connectedAs ?? ""}`)}&per_page=30&page=${page}`
    : `${apiBase}/user/repos?per_page=30&page=${page}&sort=pushed`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch GHE repositories" }, { status: 502 });
  }

  const data = (await res.json()) as GheRepo[] | { items: GheRepo[] };
  const repos = Array.isArray(data) ? data : data.items;

  return NextResponse.json({
    repos: repos.map((r) => ({
      fullName: r.full_name,
      description: r.description,
      isPrivate: r.private,
      lastActivity: r.pushed_at,
      defaultBranch: r.default_branch,
      htmlUrl: r.html_url,
      language: r.language,
      gheBaseUrl: baseUrl,
    })),
    page: parseInt(page, 10),
  });
}
