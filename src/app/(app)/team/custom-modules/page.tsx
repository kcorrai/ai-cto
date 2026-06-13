import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CustomModuleManager } from "@/components/team/CustomModuleManager";
import { Puzzle } from "lucide-react";

export default async function CustomModulesPage() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) redirect("/team");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true, plan: true },
  });
  if (!org) redirect("/team");

  if (org.plan !== "enterprise") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] mb-4">
          <Puzzle className="h-6 w-6 text-[#404040]" />
        </div>
        <h2 className="text-base font-medium text-[#f0f0f0] mb-2">Enterprise Feature</h2>
        <p className="text-sm text-[#606060] mb-6 max-w-xs">
          Custom Analysis Modules are available on the Enterprise plan.
        </p>
        <a
          href="/settings/billing"
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] transition-colors"
        >
          Upgrade to Enterprise
        </a>
      </div>
    );
  }

  const modules = await db.customModule.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });

  const initial = modules.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    prompt: m.prompt,
    enabled: m.enabled,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#f0f0f0]">Custom Analysis Modules</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Define custom analysis rules that run as part of your analysis pipeline.
        </p>
      </div>
      <CustomModuleManager initial={initial} />
    </div>
  );
}
