import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

type UserSettings = {
  gitlabAccessToken?: string;
  gitlabUsername?: string;
  gitlabHost?: string;
  [key: string]: unknown;
};

type GitLabProject = {
  id: number;
  path_with_namespace: string;
  description: string | null;
  visibility: string;
  star_count: number;
  last_activity_at: string;
  http_url_to_repo: string;
  default_branch: string;
  namespace: { kind: string; full_path: string };
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { settings: true },
  });

  const settings = (user?.settings ?? {}) as UserSettings;
  const encryptedToken = settings.gitlabAccessToken;

  if (!encryptedToken) {
    return NextResponse.json({ error: "GitLab not connected" }, { status: 400 });
  }

  const token = decrypt(encryptedToken);
  const host = settings.gitlabHost ?? "https://gitlab.com";

  const url = new URL(req.url);
  const page = url.searchParams.get("page") ?? "1";
  const search = url.searchParams.get("search") ?? "";

  const params = new URLSearchParams({
    membership: "true",
    per_page: "30",
    page,
    order_by: "last_activity_at",
    ...(search ? { search } : {}),
  });

  const res = await fetch(`${host}/api/v4/projects?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch GitLab projects" }, { status: 502 });
  }

  const projects = (await res.json()) as GitLabProject[];
  const totalPages = parseInt(res.headers.get("x-total-pages") ?? "1", 10);

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      fullPath: p.path_with_namespace,
      description: p.description,
      visibility: p.visibility,
      stars: p.star_count,
      lastActivity: p.last_activity_at,
      cloneUrl: p.http_url_to_repo,
      defaultBranch: p.default_branch,
      namespace: p.namespace.full_path,
      namespaceKind: p.namespace.kind,
    })),
    totalPages,
    page: parseInt(page, 10),
  });
}
