import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users } from "lucide-react";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "text-[#3b82f6] bg-[#1e3a5f]",
  admin: "text-purple-400 bg-purple-400/10",
  editor: "text-green-400 bg-green-400/10",
  viewer: "text-[#a0a0a0] bg-[#1a1a1a]",
};

export default async function TeamMembersPage() {
  const { userId, orgId, orgSlug } = await auth();
  if (!userId || !orgId) redirect("/dashboard");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!org) redirect("/dashboard");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f0f0]">Members</h1>
          <p className="mt-1 text-sm text-[#a0a0a0]">
            {org.members.length} {org.members.length === 1 ? "member" : "members"} in {org.name}
          </p>
        </div>
        <Link
          href={`/orgs/${orgSlug}/settings`}
          className="rounded-md bg-[#3b82f6] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          Invite Members
        </Link>
      </div>

      {org.members.length === 0 ? (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-[#404040]" />
          <p className="text-sm text-[#606060]">No members yet. Invite your team.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] divide-y divide-[#1f1f1f] overflow-hidden">
          {org.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              {member.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.user.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-[#3b82f6]">
                  {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[#f0f0f0]">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="truncate text-xs text-[#606060]">{member.user.email}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] ?? "text-[#a0a0a0] bg-[#1a1a1a]"}`}
              >
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
