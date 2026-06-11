import { Octokit } from "@octokit/rest";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export async function getGitHubClient(userId: string): Promise<Octokit> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    throw new Error("GitHub account not connected");
  }

  const token = decrypt(user.githubAccessToken);
  return new Octokit({ auth: token });
}
