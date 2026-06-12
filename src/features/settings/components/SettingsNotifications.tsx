"use client";

import { useState, useTransition } from "react";
import { updateNotificationSettings } from "@/features/settings/actions";

type Props = {
  emailOnComplete: boolean;
  weeklyDigest: boolean;
  isPro: boolean;
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

export function SettingsNotifications({
  emailOnComplete: init1,
  weeklyDigest: init2,
  isPro,
}: Props) {
  const [emailOnComplete, setEmailOnComplete] = useState(init1);
  const [weeklyDigest, setWeeklyDigest] = useState(init2);
  const [isPending, startTransition] = useTransition();

  function save(next: { emailOnComplete: boolean; weeklyDigest: boolean }) {
    startTransition(async () => {
      await updateNotificationSettings(next);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#f0f0f0]">Email when analysis completes</p>
          <p className="text-xs text-[#606060]">Get notified when your AI CTO report is ready.</p>
        </div>
        <Toggle
          checked={emailOnComplete}
          onChange={(v) => {
            setEmailOnComplete(v);
            save({ emailOnComplete: v, weeklyDigest });
          }}
          disabled={isPending}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#f0f0f0]">
            Weekly digest
            {!isPro && (
              <span className="ml-2 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#3b82f6]">
                Pro
              </span>
            )}
          </p>
          <p className="text-xs text-[#606060]">
            A weekly summary of your repository scores and trends.
          </p>
        </div>
        <Toggle
          checked={weeklyDigest}
          onChange={(v) => {
            setWeeklyDigest(v);
            save({ emailOnComplete, weeklyDigest: v });
          }}
          disabled={isPending || !isPro}
        />
      </div>
    </div>
  );
}
