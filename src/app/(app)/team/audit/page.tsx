import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AuditLogViewer } from "@/components/team/AuditLogViewer";
import { Shield } from "lucide-react";

export default async function AuditLogsPage() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) redirect("/sign-in");

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) redirect("/team");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
    select: { plan: true },
  });

  if (!org || org.plan !== "enterprise") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] mb-4">
          <Shield className="h-6 w-6 text-[#404040]" />
        </div>
        <h2 className="text-base font-medium text-[#f0f0f0] mb-2">Enterprise Feature</h2>
        <p className="text-sm text-[#606060] mb-6 max-w-xs">
          Advanced audit logging is available on the Enterprise plan.
        </p>
        <a
          href="/settings"
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] transition-colors"
        >
          Upgrade to Enterprise
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#f0f0f0]">Audit Logs</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Search and export a tamper-evident record of all security-relevant events.
        </p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
