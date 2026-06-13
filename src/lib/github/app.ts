import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { env } from "@/env";

function isAppConfigured(): boolean {
  return !!(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY);
}

function parsePrivateKey(raw: string): string {
  // Allow \n-encoded keys stored as env vars
  return raw.replace(/\\n/g, "\n");
}

export async function getAppInstallationClient(installationId: bigint): Promise<Octokit> {
  if (!isAppConfigured()) {
    throw new Error("GitHub App not configured");
  }

  const auth = createAppAuth({
    appId: env.GITHUB_APP_ID!,
    privateKey: parsePrivateKey(env.GITHUB_APP_PRIVATE_KEY!),
    installationId: Number(installationId),
  });

  const { token } = await auth({ type: "installation" });
  return new Octokit({ auth: token });
}

export function getAppInstallUrl(): string {
  const slug = env.GITHUB_APP_SLUG ?? "ai-cto-app";
  return `https://github.com/apps/${slug}/installations/new`;
}

export function isGitHubAppEnabled(): boolean {
  return isAppConfigured();
}
