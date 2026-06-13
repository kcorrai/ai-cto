"use client";

import { useState, useTransition, useEffect } from "react";
import { ExternalLink } from "lucide-react";

type Team = { id: string; name: string; key: string };
type Project = { id: string; name: string };

export function LinearPushButton({
  findingIds,
  onPushed,
  isLinearConnected,
}: {
  findingIds: string[];
  onPushed?: (results: { findingId: string; issueUrl: string }[]) => void;
  isLinearConnected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !isLinearConnected) return;
    void fetch("/api/integrations/linear/teams")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setTeams(data as Team[]);
      });
  }, [open, isLinearConnected]);

  useEffect(() => {
    void (selectedTeam
      ? fetch(`/api/integrations/linear/teams?teamId=${selectedTeam}`)
          .then((r) => r.json() as Promise<unknown>)
          .then((data) => {
            if (Array.isArray(data)) setProjects(data as Project[]);
          })
      : Promise.resolve(null).then(() => {
          setProjects([]);
          setSelectedProject("");
        }));
  }, [selectedTeam]);

  if (!isLinearConnected) {
    return (
      <a
        href="/api/integrations/linear"
        className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
      >
        Connect Linear
      </a>
    );
  }

  function handlePush() {
    if (!selectedTeam) {
      setError("Select a team");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/integrations/linear/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingIds,
          teamId: selectedTeam,
          projectId: selectedProject || undefined,
        }),
      });
      const data = (await res.json()) as {
        results?: { findingId: string; issueUrl: string }[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Push failed");
        return;
      }
      setOpen(false);
      if (data.results) onPushed?.(data.results);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden>
          <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 11.5-5-2.9V4h1.3v3.9l4.2 2.4-.5 1.2z" />
        </svg>
        {findingIds.length > 1 ? `Push ${findingIds.length} to Linear` : "Push to Linear"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
            <h3 className="mb-4 font-semibold text-[#f0f0f0]">
              Push {findingIds.length === 1 ? "finding" : `${findingIds.length} findings`} to Linear
            </h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
                >
                  <option value="">Select team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.key})
                    </option>
                  ))}
                </select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">
                    Project <span className="text-[#606060]">(optional)</span>
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-xs text-[#ef4444]">{error}</p>}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handlePush}
                disabled={isPending || !selectedTeam}
                className="flex-1 rounded-md bg-[#3b82f6] py-2 text-sm font-medium text-white hover:bg-[#2563eb] disabled:opacity-50"
              >
                {isPending ? "Pushing…" : "Create issues"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setError("");
                }}
                className="rounded-md border border-[#2a2a2a] px-4 py-2 text-sm text-[#a0a0a0] hover:text-[#f0f0f0]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function LinearBadge({ issueUrl, identifier }: { issueUrl: string; identifier?: string }) {
  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#a0a0a0] hover:text-[#f0f0f0]"
    >
      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-current" aria-hidden>
        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 11.5-5-2.9V4h1.3v3.9l4.2 2.4-.5 1.2z" />
      </svg>
      {identifier ? identifier : "In Linear"}
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}
