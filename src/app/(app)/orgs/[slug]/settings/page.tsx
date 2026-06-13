"use client";

import { OrganizationProfile } from "@clerk/nextjs";

export default function OrgSettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f0f0f0]">Team Settings</h1>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          Manage your organization profile, members, and danger zone.
        </p>
      </div>
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-[#111111] border border-[#1f1f1f] shadow-none rounded-xl",
            headerTitle: "text-[#f0f0f0]",
            headerSubtitle: "text-[#a0a0a0]",
            navbar: "border-[#1f1f1f]",
            navbarButton: "text-[#a0a0a0] hover:text-[#f0f0f0]",
            navbarButtonActive: "text-[#3b82f6]",
            pageScrollBox: "p-6",
            formFieldLabel: "text-[#a0a0a0]",
            formFieldInput: "bg-[#1a1a1a] border-[#2a2a2a] text-[#f0f0f0] focus:border-[#3b82f6]",
            formButtonPrimary: "bg-[#3b82f6] hover:bg-[#2563eb]",
            profileSection__danger: "border-red-500/20",
            badge: "bg-[#1e3a5f] text-[#3b82f6] border-[#3b82f6]/30",
          },
        }}
      />
    </div>
  );
}
