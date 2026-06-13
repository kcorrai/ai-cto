"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";

type Member = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

type AssignedUser = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
} | null;

export function AssignFinding({
  findingId,
  members,
  assigned,
  onAssign,
}: {
  findingId: string;
  members: Member[];
  assigned: AssignedUser;
  onAssign?: (user: AssignedUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<AssignedUser>(assigned);

  async function assign(userId: string | null) {
    const res = await fetch(`/api/findings/${findingId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: userId }),
    });
    if (res.ok) {
      const user = userId ? (members.find((m) => m.id === userId) ?? null) : null;
      setCurrent(user);
      onAssign?.(user);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-[#606060] transition-colors hover:text-[#a0a0a0]"
        title="Assign to team member"
      >
        {current ? (
          <>
            {current.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1e3a5f] text-[9px] font-bold text-[#3b82f6]">
                {(current.name ?? current.email).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="max-w-[80px] truncate">{current.name ?? current.email}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void assign(null);
              }}
              className="ml-0.5 text-[#606060] hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            <span>Assign</span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#2a2a2a] bg-[#161616] py-1 shadow-xl">
            {members.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#606060]">No team members</p>
            ) : (
              members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => void assign(member.id)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-[#1a1a1a] ${
                    current?.id === member.id
                      ? "text-[#3b82f6]"
                      : "text-[#a0a0a0] hover:text-[#f0f0f0]"
                  }`}
                >
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1e3a5f] text-[9px] font-bold text-[#3b82f6]">
                      {(member.name ?? member.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 truncate text-left">{member.name ?? member.email}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
