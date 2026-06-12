"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { deleteAccount } from "@/features/settings/actions";

export function SettingsDangerZone({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(input);
      if (!result.ok) {
        setError(
          result.error === "email_mismatch"
            ? "Email does not match. Please type your exact email address."
            : "Something went wrong. Please try again."
        );
        return;
      }
      router.push("/sign-out");
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-[#ef4444]/30 px-3 py-1.5 text-sm text-[#ef4444] transition-colors hover:border-[#ef4444] hover:bg-[#450a0a]"
      >
        Delete account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setOpen(false);
              setInput("");
              setError(null);
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#450a0a]">
              <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-[#f0f0f0]">Delete account</h2>
            <p className="mb-4 text-sm text-[#a0a0a0]">
              This will permanently delete your account and all your projects and analyses. This
              cannot be undone.
            </p>
            <p className="mb-2 text-xs text-[#606060]">
              Type <span className="font-mono text-[#f0f0f0]">{userEmail}</span> to confirm.
            </p>
            <input
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={userEmail}
              className="mb-3 w-full rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#ef4444]"
            />
            {error && <p className="mb-3 text-xs text-[#ef4444]">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending || input.toLowerCase() !== userEmail.toLowerCase()}
                className="flex-1 rounded-md bg-[#ef4444] py-2 text-sm font-medium text-white transition-colors hover:bg-[#dc2626] disabled:opacity-40"
              >
                {isPending ? "Deleting..." : "Delete my account"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setInput("");
                  setError(null);
                }}
                className="flex-1 rounded-md border border-[#2a2a2a] py-2 text-sm text-[#606060] transition-colors hover:text-[#f0f0f0]"
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
