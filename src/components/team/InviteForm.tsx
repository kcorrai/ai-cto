"use client";

import { useState } from "react";
import { Mail, X, Clock } from "lucide-react";

type Invitation = {
  id: string;
  emailAddress: string;
  createdAt: number;
};

export function InviteForm({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoaded, setInvitationsLoaded] = useState(false);

  async function loadInvitations() {
    if (invitationsLoaded) return;
    try {
      const res = await fetch("/api/orgs/invitations");
      if (res.ok) {
        const data = (await res.json()) as { invitations: Invitation[] };
        setInvitations(data.invitations ?? []);
        setInvitationsLoaded(true);
      }
    } catch {
      /* non-fatal */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/orgs/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: email.trim() }),
      });
      const data = (await res.json()) as { invitation?: Invitation; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to send invitation");
      } else {
        setSuccess(true);
        setEmail("");
        if (data.invitation) {
          setInvitations((prev) => [data.invitation!, ...prev]);
          setInvitationsLoaded(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function cancelInvitation(id: string) {
    try {
      const res = await fetch(`/api/orgs/invitations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      /* non-fatal */
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Invite form */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5">
        <h2 className="mb-4 text-sm font-medium text-[#f0f0f0]">Invite Member</h2>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#606060]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="h-9 w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] pl-9 pr-3 text-sm text-[#f0f0f0] placeholder-[#606060] focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="h-9 rounded-md bg-[#3b82f6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send Invite"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        {success && <p className="mt-2 text-xs text-green-400">Invitation sent successfully!</p>}
      </div>

      {/* Pending invitations */}
      <div>
        <button
          onClick={loadInvitations}
          className="mb-3 text-xs text-[#606060] underline underline-offset-2 hover:text-[#a0a0a0]"
        >
          {invitationsLoaded ? "Pending Invitations" : "Show Pending Invitations"}
        </button>

        {invitationsLoaded && invitations.length > 0 && (
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] divide-y divide-[#1f1f1f] overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <Clock className="h-4 w-4 shrink-0 text-[#606060]" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-[#f0f0f0]">{inv.emailAddress}</p>
                  <p className="text-xs text-[#606060]">
                    Sent {new Date(inv.createdAt).toLocaleDateString()} · Expires in 7 days
                  </p>
                </div>
                <button
                  onClick={() => cancelInvitation(inv.id)}
                  className="rounded-md p-1 text-[#606060] transition-colors hover:text-red-400"
                  title="Cancel invitation"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {invitationsLoaded && invitations.length === 0 && (
          <p className="text-xs text-[#606060]">No pending invitations.</p>
        )}
      </div>
    </div>
  );
}
