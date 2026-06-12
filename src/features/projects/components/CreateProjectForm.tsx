"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { RepoBrowser } from "./RepoBrowser";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { createProject } from "@/features/projects/actions";
import type { Repo } from "@/lib/github/types";

type Step = 1 | 2 | 3;

export function CreateProjectForm() {
  const [step, setStep] = useState<Step>(1);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedRepo) return;
    fetch(`/api/github/branches?repo=${encodeURIComponent(selectedRepo.fullName)}`)
      .then((r) => r.json())
      .then((data: string[]) => {
        setBranches(data);
        setBranch(selectedRepo.defaultBranch);
      })
      .catch(() => {
        setBranches([selectedRepo.defaultBranch]);
        setBranch(selectedRepo.defaultBranch);
      })
      .finally(() => setBranchesLoading(false));
  }, [selectedRepo]);

  function handleRepoSelect(repo: Repo) {
    setSelectedRepo(repo);
    setName(repo.name);
    setDuplicateError(false);
    setBranchesLoading(true);
    setBranches([]);
    setStep(2);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo || !branch) return;
    setStep(3);
    startTransition(async () => {
      const result = await createProject({
        name: name.trim() || selectedRepo.name,
        githubRepoId: selectedRepo.id,
        githubOwner: selectedRepo.fullName.split("/")[0]!,
        githubRepo: selectedRepo.name,
        githubBranch: branch,
        githubUrl: `https://github.com/${selectedRepo.fullName}`,
        isPrivate: selectedRepo.isPrivate,
        language: selectedRepo.language,
      });

      if (!result.ok) {
        setStep(2);
        if (result.error === "plan_limit") setShowPlanLimit(true);
        if (result.error === "duplicate_repo") setDuplicateError(true);
      }
      // on success, redirect happens inside the server action
    });
  }

  return (
    <>
      {showPlanLimit && <PlanLimitModal onClose={() => setShowPlanLimit(false)} />}

      <div className="mx-auto max-w-[720px] px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="mb-4 flex items-center gap-1 text-sm text-[#606060] transition-colors hover:text-[#f0f0f0]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex items-center gap-3">
            {([1, 2, 3] as Step[]).map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    step === n
                      ? "bg-[#3b82f6] text-white"
                      : step > n
                        ? "bg-[#1e3a5f] text-[#3b82f6]"
                        : "bg-[#1a1a1a] text-[#606060]"
                  }`}
                >
                  {n}
                </div>
                {n < 3 && <div className="h-px w-8 bg-[#2a2a2a]" />}
              </div>
            ))}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[#f0f0f0]">
            {step === 1 && "Select a repository"}
            {step === 2 && "Configure your project"}
            {step === 3 && "Creating project…"}
          </h1>
        </div>

        {/* Step 1 — Repo browser */}
        {step === 1 && <RepoBrowser onSelect={handleRepoSelect} />}

        {/* Step 2 — Config */}
        {step === 2 && selectedRepo && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-sm text-[#a0a0a0]">
              <span className="font-medium text-[#f0f0f0]">{selectedRepo.fullName}</span>
              {selectedRepo.language && (
                <span className="ml-2 text-[#606060]">· {selectedRepo.language}</span>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#f0f0f0]">
                Project name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#f0f0f0]">Branch</label>
              {branchesLoading ? (
                <div className="flex h-9 items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#606060]" />
                  <span className="text-sm text-[#606060]">Loading branches…</span>
                </div>
              ) : (
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3b82f6]"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {duplicateError && (
              <p className="rounded-md border border-[#ef4444]/20 bg-[#450a0a] px-3 py-2 text-sm text-[#ef4444]">
                This repository is already connected to a project.
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || branchesLoading}
              className="w-full rounded-md bg-[#3b82f6] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb] disabled:opacity-50"
            >
              Create project
            </button>
          </form>
        )}

        {/* Step 3 — Creating */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
            <p className="text-sm text-[#a0a0a0]">Setting up your project…</p>
          </div>
        )}
      </div>
    </>
  );
}
