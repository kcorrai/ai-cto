"use client";

import { useState, useTransition } from "react";
import { updateNotificationSettings } from "@/features/settings/actions";

type Props = {
  emailOnComplete: boolean;
  weeklyDigest: boolean;
  emailOnCritical: boolean;
  emailOnAssigned: boolean;
  emailOnMention: boolean;
  isPro: boolean;
  isTeamMember: boolean;
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] ${
        disabled ? "cursor-not-allowed opacity-40" : ""
      } ${checked ? "bg-[#3b82f6]" : "bg-[#2a2a2a]"}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

type SettingsState = {
  emailOnComplete: boolean;
  weeklyDigest: boolean;
  emailOnCritical: boolean;
  emailOnAssigned: boolean;
  emailOnMention: boolean;
};

export function SettingsNotifications({
  emailOnComplete: init1,
  weeklyDigest: init2,
  emailOnCritical: init3,
  emailOnAssigned: init4,
  emailOnMention: init5,
  isPro,
  isTeamMember,
}: Props) {
  const [settings, setSettings] = useState<SettingsState>({
    emailOnComplete: init1,
    weeklyDigest: init2,
    emailOnCritical: init3,
    emailOnAssigned: init4,
    emailOnMention: init5,
  });
  const [isPending, startTransition] = useTransition();

  function update(patch: Partial<SettingsState>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    startTransition(async () => {
      await updateNotificationSettings(next);
    });
  }

  return (
    <div className="space-y-6">
      {/* Personal notifications */}
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-[#606060]">Personal</p>

        <Row
          title="Email when analysis completes"
          description="Get notified when your AI CTO report is ready."
        >
          <Toggle
            checked={settings.emailOnComplete}
            onChange={(v) => update({ emailOnComplete: v })}
            disabled={isPending}
          />
        </Row>

        <Row
          title="Email on critical findings"
          description="Receive an email when a critical issue is detected in any of your projects."
        >
          <Toggle
            checked={settings.emailOnCritical}
            onChange={(v) => update({ emailOnCritical: v })}
            disabled={isPending}
          />
        </Row>

        <Row
          title={
            <span>
              Weekly digest
              {!isPro && (
                <span className="ml-2 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#3b82f6]">
                  Pro
                </span>
              )}
            </span>
          }
          description="A weekly summary of your repository scores and trends."
        >
          <Toggle
            checked={settings.weeklyDigest}
            onChange={(v) => update({ weeklyDigest: v })}
            disabled={isPending || !isPro}
          />
        </Row>
      </div>

      {/* Team notifications */}
      {isTeamMember && (
        <div className="space-y-4 border-t border-[#2a2a2a] pt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-[#606060]">Team</p>

          <Row
            title="Email when assigned a finding"
            description="Get notified when a team member assigns a finding to you."
          >
            <Toggle
              checked={settings.emailOnAssigned}
              onChange={(v) => update({ emailOnAssigned: v })}
              disabled={isPending}
            />
          </Row>

          <Row
            title="Email on @mention in comments"
            description="Get notified when you are mentioned in a finding comment."
          >
            <Toggle
              checked={settings.emailOnMention}
              onChange={(v) => update({ emailOnMention: v })}
              disabled={isPending}
            />
          </Row>
        </div>
      )}
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#f0f0f0]">{title}</p>
        <p className="text-xs text-[#606060]">{description}</p>
      </div>
      {children}
    </div>
  );
}
