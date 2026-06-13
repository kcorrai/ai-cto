"use client";

import { CreateOrganization } from "@clerk/nextjs";

export default function CreateTeamPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-[#f0f0f0]">Create a Team</h1>
          <p className="mt-1 text-sm text-[#a0a0a0]">
            Collaborate on projects and share analysis reports with your team.
          </p>
        </div>
        <CreateOrganization
          afterCreateOrganizationUrl="/team"
          skipInvitationScreen={false}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#111111] border border-[#1f1f1f] shadow-none w-full rounded-xl",
              headerTitle: "text-[#f0f0f0]",
              headerSubtitle: "text-[#a0a0a0]",
              socialButtonsIconButton: "border-[#2a2a2a]",
              dividerLine: "bg-[#1f1f1f]",
              dividerText: "text-[#606060]",
              formFieldLabel: "text-[#a0a0a0]",
              formFieldInput: "bg-[#1a1a1a] border-[#2a2a2a] text-[#f0f0f0] focus:border-[#3b82f6]",
              footerActionLink: "text-[#3b82f6]",
              formButtonPrimary: "bg-[#3b82f6] hover:bg-[#2563eb]",
            },
          }}
        />
      </div>
    </div>
  );
}
