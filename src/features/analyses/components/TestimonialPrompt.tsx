"use client";

import { useState } from "react";
import { X, Star, ChevronRight } from "lucide-react";

export function TestimonialPrompt({
  userName,
  projectName,
}: {
  userName: string;
  projectName: string;
}) {
  const [step, setStep] = useState<"rating" | "form" | "done" | "dismissed">("rating");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 px-5 py-4">
        <Star className="h-4 w-4 flex-shrink-0 text-[#22c55e]" />
        <p className="text-sm text-[#a0a0a0]">
          Thanks for your feedback! We&apos;ll review and display it on our site.
        </p>
      </div>
    );
  }

  if (step === "dismissed") return null;

  if (step === "rating") {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] px-5 py-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#f0f0f0]">Was this analysis helpful?</p>
          <p className="mt-0.5 text-xs text-[#606060]">Help others discover AI CTO</p>
        </div>
        <button
          onClick={() => setStep("form")}
          className="flex items-center gap-1.5 rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]"
        >
          Yes, share feedback <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setStep("dismissed")}
          className="text-[#606060] hover:text-[#a0a0a0]"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // form
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        productName: projectName,
        quote: quote.trim(),
      }),
    });
    setStep("done");
    setSubmitting(false);
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-[#f0f0f0]">Share your experience</p>
        <button
          onClick={() => setStep("dismissed")}
          className="text-[#606060] hover:text-[#a0a0a0]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="What did you find most valuable about the AI CTO report?"
          rows={3}
          required
          minLength={10}
          maxLength={500}
          className="w-full resize-none rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#3a3a3a] outline-none focus:border-[#3b82f6]"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#606060]">{quote.length}/500 · reviewed before display</p>
          <button
            type="submit"
            disabled={submitting || quote.trim().length < 10}
            className="rounded-md bg-[#3b82f6] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
