import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#3b82f6]">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-[#f0f0f0]">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-[#606060]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
