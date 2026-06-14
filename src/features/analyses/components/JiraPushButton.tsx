"use client";

import { useState, useTransition, useEffect } from "react";
import { ExternalLink } from "lucide-react";

type JiraProject = { id: string; key: string; name: string };

export function JiraPushButton({
  findingId,
  isJiraConnected,
  onPushed,
}: {
  findingId: string;
  isJiraConnected: boolean;
  onPushed?: (issueKey: string, issueUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [issueType, setIssueType] = useState("Task");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !isJiraConnected) return;
    void fetch("/api/integrations/jira/projects")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setProjects(data as JiraProject[]);
      });
  }, [open, isJiraConnected]);

  if (!isJiraConnected) {
    return (
      <a
        href="/api/integrations/jira/connect"
        className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
      >
        Connect Jira
      </a>
    );
  }

  function handlePush() {
    if (!selectedProject) {
      setError("Select a project");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/integrations/jira/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, jiraProjectKey: selectedProject, issueType }),
      });
      const data = (await res.json()) as { issueKey?: string; issueUrl?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Push failed");
        return;
      }
      setOpen(false);
      if (data.issueKey && data.issueUrl) onPushed?.(data.issueKey, data.issueUrl);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-[#0052CC]" aria-hidden>
          <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.012 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.016 12.49V1.005A1.001 1.001 0 0 0 23.012 0z" />
        </svg>
        Push to Jira
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
            <h3 className="mb-4 font-semibold text-[#f0f0f0]">Push finding to Jira</h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
                >
                  <option value="">Select project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.key}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Issue type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
                >
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Story">Story</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>

              {error && <p className="text-xs text-[#ef4444]">{error}</p>}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handlePush}
                disabled={isPending || !selectedProject}
                className="flex-1 rounded-md bg-[#0052CC] py-2 text-sm font-medium text-white hover:bg-[#0047B3] disabled:opacity-50"
              >
                {isPending ? "Pushing…" : "Create issue"}
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

export function JiraBadge({ issueKey, issueUrl }: { issueKey: string; issueUrl: string }) {
  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#a0a0a0] hover:text-[#f0f0f0]"
    >
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-[#0052CC]" aria-hidden>
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.012 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.016 12.49V1.005A1.001 1.001 0 0 0 23.012 0z" />
      </svg>
      {issueKey}
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}
