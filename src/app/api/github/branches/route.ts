import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGitHubClient } from "@/lib/github/client";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = req.nextUrl.searchParams.get("repo");
  if (!repo || !repo.includes("/")) {
    return NextResponse.json({ error: "Missing or invalid repo param" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [owner, name] = repo.split("/") as [string, string];
  const octokit = await getGitHubClient(user.id);

  const { data } = await octokit.repos.listBranches({
    owner,
    repo: name,
    per_page: 100,
  });

  return NextResponse.json(data.map((b) => b.name));
}
