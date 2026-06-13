import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WhiteLabelAdminPanel } from "@/components/white-label/WhiteLabelAdminPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "White-Label Admin — AI CTO" };

export default async function WhiteLabelPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) redirect("/sign-in");

  // Find orgs where user is owner/admin
  const memberships = await db.organizationMember.findMany({
    where: { userId: user.id, role: { in: ["owner", "admin"] } },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          plan: true,
          settings: true,
          projects: {
            where: { status: "active" },
            select: {
              id: true,
              name: true,
              githubOwner: true,
              githubRepo: true,
              latestScore: true,
              lastAnalyzedAt: true,
              user: { select: { name: true, email: true } },
            },
            orderBy: { latestScore: "asc" },
          },
        },
      },
    },
  });

  const enterpriseOrgs = memberships
    .filter((m) => m.organization.plan === "enterprise")
    .map((m) => ({
      ...m.organization,
      role: m.role,
    }));

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-[#606060]">Enterprise</p>
        <h1 className="mt-1 text-xl font-semibold text-[#f0f0f0]">White-Label Platform</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Manage custom branding and bulk analysis for your client portfolio.
        </p>
      </div>

      {enterpriseOrgs.length === 0 ? (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-12 text-center">
          <p className="text-sm text-[#606060]">
            White-label is available on Enterprise plans. Contact us to upgrade.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {enterpriseOrgs.map((org) => (
            <WhiteLabelAdminPanel
              key={org.id}
              orgId={org.id}
              orgName={org.name}
              settings={org.settings as Record<string, unknown>}
              projects={org.projects.map((p) => ({
                id: p.id,
                name: p.name,
                githubOwner: p.githubOwner,
                githubRepo: p.githubRepo,
                latestScore: p.latestScore,
                lastAnalyzedAt: p.lastAnalyzedAt?.toISOString() ?? null,
                ownerName: p.user.name ?? p.user.email,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
