"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#ef4444]/30 bg-[#450a0a]">
        <span className="text-lg">⚠</span>
      </div>
      <h2 className="text-lg font-semibold text-[#f0f0f0]">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-[#606060]">
        An unexpected error occurred. Please try again or go back to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-[#2a2a2a] bg-[#111111] px-4 py-2 text-sm font-medium text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0]"
        >
          Dashboard
        </Link>
      </div>
      {error.digest && <p className="mt-4 text-[10px] text-[#404040]">Error ID: {error.digest}</p>}
    </div>
  );
}
