import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { GitHubConnectButton } from "@/components/settings/GitHubConnectButton";
import { SettingsNotifications } from "@/features/settings/components/SettingsNotifications";
import { SettingsBilling } from "@/features/settings/components/SettingsBilling";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";
import { SettingsApiKeys } from "@/features/settings/components/SettingsApiKeys";
import { getPlanLimits } from "@/lib/billing/limits";
import { isGitHubAppEnabled } from "@/lib/github/app";
import { ensureReferralCode, getReferralStats } from "@/lib/referral";
import { SettingsReferral } from "@/features/settings/components/SettingsReferral";

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
        githubInstallationId: true,
        settings: true,
      },
    }),
  ]);

  if (!dbUser) redirect("/sign-in");

  const hasAppInstallation = !!dbUser.githubInstallationId;
  const isGitHubConnected = !!dbUser.githubAccessToken || hasAppInstallation;
  const useGitHubApp = isGitHubAppEnabled();
  const userSettings = (dbUser.settings as Record<string, unknown>) ?? {};
  const isLinearConnected = !!userSettings.linearAccessToken;
  const linearUserName = userSettings.linearUserName as string | undefined;
  const emailOnComplete = Boolean(userSettings.emailOnComplete ?? true);
  const weeklyDigest = Boolean(userSettings.weeklyDigest ?? false);
  const emailOnCritical = Boolean(userSettings.emailOnCritical ?? true);
  const emailOnAssigned = Boolean(userSettings.emailOnAssigned ?? true);
  const emailOnMention = Boolean(userSettings.emailOnMention ?? true);
  const isPro = dbUser.plan !== "free";
  const limits = getPlanLimits(dbUser.plan);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const apiKeys = await db.apiKey.findMany({
    where: { userId: dbUser.id, isActive: true },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const isTeamMember = await db.organizationMember
    .count({ where: { userId: dbUser.id } })
    .then((c) => c > 0);

  const [referralCode, referralStats] = await Promise.all([
    ensureReferralCode(dbUser.id),
    getReferralStats(dbUser.id),
  ]);
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/r/${referralCode}`;

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
            <GitHubConnectButton
              isConnected={isGitHubConnected}
              hasAppInstallation={hasAppInstallation}
              useGitHubApp={useGitHubApp}
            />
          </div>
        </Section>

        {/* Linear integration */}
        <Section
          title="Linear Integration"
          description="Connect Linear to push findings as issues directly from AI CTO."
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              {isLinearConnected ? (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <span className="text-sm text-[#a0a0a0]">
                    {linearUserName ? `Connected as ${linearUserName}` : "Linear connected"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#606060]" />
                  <span className="text-sm text-[#606060]">Not connected</span>
                </div>
              )}
            </div>
            {isLinearConnected ? (
              <form action="/api/integrations/linear" method="post" onSubmit={undefined}>
                <a
                  href="/api/integrations/linear"
                  className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#ef4444]/40 hover:text-[#ef4444]"
                >
                  Disconnect
                </a>
              </form>
            ) : (
              <a
                href="/api/integrations/linear"
                className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
              >
                Connect Linear
              </a>
            )}
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" description="Choose when you receive emails from AI CTO.">
          <SettingsNotifications
            emailOnComplete={emailOnComplete}
            weeklyDigest={weeklyDigest}
            emailOnCritical={emailOnCritical}
            emailOnAssigned={emailOnAssigned}
            emailOnMention={emailOnMention}
            isPro={isPro}
            isTeamMember={isTeamMember}
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

        {/* API Keys */}
        <Section
          title="API Keys"
          description="Authenticate programmatic API access. Available on Pro and higher plans."
        >
          <SettingsApiKeys
            initialKeys={apiKeys.map((k) => ({
              ...k,
              lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
              expiresAt: k.expiresAt?.toISOString() ?? null,
              createdAt: k.createdAt.toISOString(),
            }))}
            isPro={isPro}
          />
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-[#606060]" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#a0a0a0]">GitHub Actions integration</p>
              <p className="mt-0.5 text-xs text-[#606060]">
                Trigger analyses automatically on every push to main.
              </p>
            </div>
            <Link
              href="/docs/github-actions"
              className="shrink-0 rounded border border-[#2a2a2a] px-2.5 py-1 text-xs text-[#606060] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
            >
              Setup guide →
            </Link>
          </div>
        </Section>

        {/* Referral Program */}
        <Section
          title="Referral Program"
          description="Invite friends and earn $10 credit when they convert to Pro."
        >
          <SettingsReferral
            referralLink={referralLink}
            totalReferrals={referralStats.totalReferrals}
            conversions={referralStats.conversions}
            totalCredits={referralStats.totalCredits}
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
