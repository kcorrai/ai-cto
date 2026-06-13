import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TeamOnboardingClient } from "@/components/team/TeamOnboarding";

export default async function TeamOnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { name: true, _count: { select: { projects: true } } },
  });
  if (!org) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-col items-center justify-start p-8 pt-16">
      <TeamOnboardingClient orgName={org.name} hasProjects={org._count.projects > 0} />
    </div>
  );
}
