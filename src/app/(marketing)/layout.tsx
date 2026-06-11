import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "AI CTO — Your AI Technical Co-Founder",
  description:
    "Analyze your GitHub repository like a senior CTO. Get actionable insights on architecture, security, code quality, and SaaS readiness in minutes.",
  openGraph: {
    title: "AI CTO — Your AI Technical Co-Founder",
    description:
      "Analyze your GitHub repository like a senior CTO. Get actionable insights on architecture, security, code quality, and SaaS readiness in minutes.",
    images: "/og.png",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <nav className="sticky top-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3b82f6]" />
            <span className="font-semibold tracking-tight">AI CTO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-[#a0a0a0] transition-colors hover:text-[#f0f0f0]"
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-[#a0a0a0] transition-colors hover:text-[#f0f0f0]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-[#3b82f6] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2563eb]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="border-t border-[#1f1f1f] py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div>
              <Link href="/" className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#3b82f6]" />
                <span className="font-semibold text-[#f0f0f0]">AI CTO</span>
              </Link>
              <p className="text-xs text-[#606060]">Your AI Technical Co-Founder.</p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#606060]">
                  Product
                </p>
                <ul className="space-y-2.5 text-sm text-[#a0a0a0]">
                  <li>
                    <Link href="/pricing" className="hover:text-[#f0f0f0]">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="hover:text-[#f0f0f0]">
                      Sign up
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-in" className="hover:text-[#f0f0f0]">
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#606060]">
                  Legal
                </p>
                <ul className="space-y-2.5 text-sm text-[#a0a0a0]">
                  <li>
                    <Link href="/privacy" className="hover:text-[#f0f0f0]">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-[#f0f0f0]">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-[#1f1f1f] pt-8 text-xs text-[#606060]">
            © {new Date().getFullYear()} AI CTO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
