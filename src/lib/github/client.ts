import { Octokit } from "@octokit/rest";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { getAppInstallationClient, isGitHubAppEnabled } from "./app";
import { sendEmail } from "@/lib/email";
import { GitHubTokenExpiredEmail } from "@/emails/GitHubTokenExpiredEmail";
import { env } from "@/env";

export async function getGitHubClient(userId: string): Promise<Octokit> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      githubAccessToken: true,
      githubInstallationId: true,
      githubTokenExpiredAt: true,
    },
  });

  // Prefer GitHub App installation token (higher rate limits, no long-lived token storage)
  if (isGitHubAppEnabled() && user?.githubInstallationId) {
    return getAppInstallationClient(user.githubInstallationId);
  }

  // Token known to be expired
  if (user?.githubTokenExpiredAt) {
    throw new Error("GitHub account disconnected — please reconnect in Settings");
  }

  // Fall back to OAuth token
  if (user?.githubAccessToken) {
    const token = decrypt(user.githubAccessToken);
    return new Octokit({ auth: token });
  }

  throw new Error("GitHub account not connected");
}

/**
 * Call when a GitHub API call returns 401 for a given userId.
 * Clears the token, records the expiry, and sends a one-time notification email.
 */
export async function handleGitHub401(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, githubTokenExpiredAt: true },
  });
  if (!user) return;

  // Already handled — don't send duplicate email
  if (user.githubTokenExpiredAt) return;

  await db.user.update({
    where: { id: userId },
    data: { githubAccessToken: null, githubTokenExpiredAt: new Date() },
  });

  // Send one-time notification
  await sendEmail({
    to: user.email,
    subject: "Your GitHub connection has expired — AI CTO",
    react: GitHubTokenExpiredEmail({
      name: user.name ?? user.email,
      reconnectUrl: `${env.NEXT_PUBLIC_APP_URL}/settings`,
    }),
  });
}
