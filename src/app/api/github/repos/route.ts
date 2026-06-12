import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getGitHubClient } from "@/lib/github/client";
import type { Repo, ReposResponse } from "@/lib/github/types";

export type { Repo, ReposResponse };

const CACHE_TTL = 300; // 5 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickRepo(r: any): Repo {
  return {
    id: r.id as number,
    name: r.name as string,
    fullName: r.full_name as string,
    isPrivate: r.private as boolean,
    language: (r.language as string | null) ?? null,
    updatedAt: (r.updated_at as string | null) ?? new Date().toISOString(),
    defaultBranch: (r.default_branch as string) ?? "main",
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  const cacheKey = `github:repos:${user.id}`;
  const cached = await redis.get<ReposResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const octokit = await getGitHubClient(user.id);

  const personalData = await octokit.repos.listForAuthenticatedUser({
    affiliation: "owner",
    sort: "updated",
    per_page: 100,
  });

  const personal = personalData.data.map(pickRepo);

  // read:org scope required — gracefully degrade if missing
  let orgRepos: { login: string; repos: Repo[] }[] = [];
  try {
    const orgsData = await octokit.orgs.listForAuthenticatedUser({ per_page: 100 });
    orgRepos = await Promise.all(
      orgsData.data.map(async (org) => {
        const { data } = await octokit.repos.listForOrg({
          org: org.login,
          sort: "updated",
          per_page: 100,
        });
        return { login: org.login, repos: data.map(pickRepo) };
      })
    );
  } catch {
    // token lacks read:org scope — personal repos only
  }

  const result: ReposResponse = { personal, orgs: orgRepos };
  await redis.set(cacheKey, result, { ex: CACHE_TTL });

  return NextResponse.json(result);
}
