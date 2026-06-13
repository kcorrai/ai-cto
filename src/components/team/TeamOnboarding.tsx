"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, FolderKanban, Slack, Check, ArrowRight, ChevronRight } from "lucide-react";

type Step = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  href?: string;
  done?: boolean;
};

export function TeamOnboardingClient({
  orgName,
  hasProjects,
}: {
  orgName: string;
  hasProjects: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);

  const steps: Step[] = [
    {
      id: "projects",
      icon: FolderKanban,
      title: "Add your first project",
      description: "Connect a GitHub repository to start analyzing your codebase.",
      cta: "Add project",
      href: "/projects/new",
      done: hasProjects,
    },
    {
      id: "members",
      icon: Users,
      title: "Invite team members",
      description: "Bring your team in — they can view reports, resolve findings, and collaborate.",
      cta: "Invite members",
      href: "/team/members",
      done: false,
    },
    {
      id: "slack",
      icon: Slack,
      title: "Connect Slack",
      description: "Get notified when analyses complete or critical findings are detected.",
      cta: "Connect Slack",
      href: "/team/settings",
      done: false,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  if (dismissed) return null;

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-[#f0f0f0]">Welcome to {orgName}!</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          {completedCount}/{steps.length} steps complete — let&apos;s set up your team.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full rounded-full bg-[#1f1f1f]">
        <div
          className="h-full rounded-full bg-[#3b82f6] transition-all"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-xl border p-4 transition-colors ${
              step.done ? "border-green-500/30 bg-green-500/5" : "border-[#1f1f1f] bg-[#111111]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  step.done ? "bg-green-500/20" : "bg-[#1e3a5f]"
                }`}
              >
                {step.done ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <step.icon className="h-4 w-4 text-[#3b82f6]" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`text-sm font-medium ${
                    step.done ? "text-[#606060] line-through" : "text-[#f0f0f0]"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#606060]">{step.description}</p>
              </div>
              {!step.done && step.href && (
                <Link
                  href={step.href}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  {step.cta}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-[#606060] hover:text-[#a0a0a0]"
        >
          Skip for now
        </button>
        <Link
          href="/team"
          className="flex items-center gap-1.5 text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]"
        >
          Go to team dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
