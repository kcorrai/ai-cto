"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

interface Props {
  analysisId: string;
  totalVisible: number;
}

export function ExportCsvButton({ analysisId, totalVisible }: Props) {
  const searchParams = useSearchParams();

  function buildExportUrl() {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const severity = searchParams.get("severity");
    const mod = searchParams.get("module");
    const status = searchParams.get("status");
    if (q) params.set("q", q);
    if (severity) params.set("severity", severity);
    if (mod) params.set("module", mod);
    if (status && status !== "all") params.set("status", status);
    const qs = params.toString();
    return `/api/analyses/${analysisId}/export/csv${qs ? `?${qs}` : ""}`;
  }

  return (
    <a
      href={buildExportUrl()}
      download
      aria-disabled={totalVisible === 0}
      onClick={(e) => totalVisible === 0 && e.preventDefault()}
      className={`flex items-center gap-1.5 rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-1.5 text-xs font-medium transition-colors ${
        totalVisible === 0
          ? "cursor-not-allowed text-[#404040]"
          : "text-[#a0a0a0] hover:border-[#404040] hover:text-[#f0f0f0]"
      }`}
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </a>
  );
}
