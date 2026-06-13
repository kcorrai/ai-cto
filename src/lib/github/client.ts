import { Octokit } from "@octokit/rest";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { getAppInstallationClient, isGitHubAppEnabled } from "./app";

export async function getGitHubClient(userId: string): Promise<Octokit> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { githubAccessToken: true, githubInstallationId: true },
  });

  // Prefer GitHub App installation token (higher rate limits, no long-lived token storage)
  if (isGitHubAppEnabled() && user?.githubInstallationId) {
    return getAppInstallationClient(user.githubInstallationId);
  }

  // Fall back to OAuth token
  if (user?.githubAccessToken) {
    const token = decrypt(user.githubAccessToken);
    return new Octokit({ auth: token });
  }

  throw new Error("GitHub account not connected");
}
