import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GitHubConnectButton } from "@/components/settings/GitHubConnectButton";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { githubAccessToken: true, githubUsername: true },
  });

  const isConnected = !!user?.githubAccessToken;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-[#f0f0f0]">Settings</h2>
      <p className="mt-1 text-sm text-[#606060]">Manage your account and integrations.</p>

      <div className="mt-8 max-w-[720px]">
        <section className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
          <div className="border-b border-[#2a2a2a] px-6 py-4">
            <h3 className="text-sm font-semibold text-[#f0f0f0]">GitHub Integration</h3>
            <p className="mt-0.5 text-xs text-[#606060]">
              Connect your GitHub account to analyze repositories.
            </p>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <span className="text-sm text-[#a0a0a0]">
                    {user?.githubUsername
                      ? `Connected as @${user.githubUsername}`
                      : "GitHub connected"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#606060]" />
                  <span className="text-sm text-[#606060]">Not connected</span>
                </div>
              )}
            </div>
            <GitHubConnectButton isConnected={isConnected} />
          </div>
        </section>
      </div>
    </div>
  );
}
