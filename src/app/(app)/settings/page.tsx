import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { GitHubConnectButton } from "@/components/settings/GitHubConnectButton";
import { SettingsNotifications } from "@/features/settings/components/SettingsNotifications";
import { SettingsBilling } from "@/features/settings/components/SettingsBilling";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";
import { getPlanLimits } from "@/lib/billing/limits";

export const metadata: Metadata = { title: "Settings — AI CTO" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
      <div className="border-b border-[#2a2a2a] px-6 py-4">
        <h3 className="text-sm font-semibold text-[#f0f0f0]">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-[#606060]">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        stripeCustomerId: true,
        githubAccessToken: true,
        githubUsername: true,
        settings: true,
      },
    }),
  ]);

  if (!dbUser) redirect("/sign-in");

  const isGitHubConnected = !!dbUser.githubAccessToken;
  const userSettings = (dbUser.settings as Record<string, unknown>) ?? {};
  const emailOnComplete = Boolean(userSettings.emailOnComplete ?? true);
  const weeklyDigest = Boolean(userSettings.weeklyDigest ?? false);
  const isPro = dbUser.plan !== "free";
  const limits = getPlanLimits(dbUser.plan);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const analysesThisMonth = await db.analysis.count({
    where: {
      triggeredById: dbUser.id,
      createdAt: { gte: monthStart },
      status: { not: "failed" },
    },
  });

  const displayName =
    dbUser.name ||
    (clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") : null) ||
    dbUser.email;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">Settings</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Manage your account, integrations, and billing.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <Section title="Profile" description="Your account information from Clerk.">
          <div className="flex items-center gap-4">
            {dbUser.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dbUser.avatarUrl}
                alt={displayName ?? "Avatar"}
                className="h-12 w-12 rounded-full"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#f0f0f0]">{displayName}</p>
              <p className="truncate text-xs text-[#606060]">{dbUser.email}</p>
            </div>
            <a
              href="https://accounts.clerk.dev/user"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
            >
              Edit in Clerk ↗
            </a>
          </div>
        </Section>

        {/* GitHub */}
        <Section
          title="GitHub Integration"
          description="Connect your GitHub account to analyze repositories."
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              {isGitHubConnected ? (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <span className="text-sm text-[#a0a0a0]">
                    {dbUser.githubUsername
                      ? `Connected as @${dbUser.githubUsername}`
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
            <GitHubConnectButton isConnected={isGitHubConnected} />
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" description="Choose when you receive emails from AI CTO.">
          <SettingsNotifications
            emailOnComplete={emailOnComplete}
            weeklyDigest={weeklyDigest}
            isPro={isPro}
          />
        </Section>

        {/* Plan & Billing */}
        <Section title="Plan & Billing" description="Your current plan and usage this month.">
          <SettingsBilling
            plan={dbUser.plan}
            analysesThisMonth={analysesThisMonth}
            maxAnalysesPerMonth={limits.maxAnalysesPerMonth}
            hasStripeCustomer={!!dbUser.stripeCustomerId}
          />
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#f0f0f0]">Delete account</p>
              <p className="text-xs text-[#606060]">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            <SettingsDangerZone userEmail={dbUser.email} />
          </div>
        </Section>
      </div>
    </div>
  );
}
