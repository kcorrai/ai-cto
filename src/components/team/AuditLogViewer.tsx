"use client";

import { useState, useCallback } from "react";
import { Search, Download, ChevronLeft, ChevronRight, Shield, RefreshCw } from "lucide-react";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  );
}

type AuditLog = {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  resourceName: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
};

type ApiResponse = {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
};

const ACTION_COLORS: Record<string, string> = {
  "user.": "text-[#60a5fa] bg-[#1e3a5f]",
  "project.": "text-[#34d399] bg-[#064e3b]",
  "sso.": "text-[#a78bfa] bg-[#2e1065]",
  "scim.": "text-[#f59e0b] bg-[#78350f]",
  "member.": "text-[#f472b6] bg-[#4a044e]",
  "api_key.": "text-[#fb923c] bg-[#431407]",
  "report.": "text-[#22d3ee] bg-[#083344]",
  "subscription.": "text-[#4ade80] bg-[#052e16]",
  "org.": "text-[#e2e8f0] bg-[#1e293b]",
};

function actionColor(action: string): string {
  for (const [prefix, cls] of Object.entries(ACTION_COLORS)) {
    if (action.startsWith(prefix)) return cls;
  }
  return "text-[#a0a0a0] bg-[#1f1f1f]";
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetch_ = useCallback(
    async (p = page) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (action) params.set("action", action);
      if (resource) params.set("resource", resource);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/orgs/audit?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as ApiResponse;
        setLogs(data.logs);
        setTotal(data.total);
        setPage(p);
        setSearched(true);
      }
      setLoading(false);
    },
    [page, action, resource, from, to]
  );

  async function search() {
    await fetch_(1);
  }

  async function exportCsv() {
    const params = new URLSearchParams({ format: "csv" });
    if (action) params.set("action", action);
    if (resource) params.set("resource", resource);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/orgs/audit?${params.toString()}`;
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#606060]" />
            <input
              type="text"
              placeholder="Action (e.g. sso.)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] py-2 pl-8 pr-3 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Resource (e.g. project)"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
          <div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
          <div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => void search()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-opacity"
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
            Search
          </button>
          {searched && (
            <button
              onClick={() => void exportCsv()}
              className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-4 py-2 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          )}
          {searched && (
            <span className="ml-auto text-xs text-[#606060]">
              {total.toLocaleString()} event{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {!searched ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111111] py-16">
          <Shield className="h-8 w-8 text-[#303030] mb-3" />
          <p className="text-sm text-[#606060]">Search to view audit events</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111111] py-16">
          <p className="text-sm text-[#606060]">No events match your filters</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                <th className="px-4 py-2.5 text-left font-medium text-[#606060]">Time</th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060]">Action</th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060] hidden sm:table-cell">
                  Resource
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060] hidden md:table-cell">
                  User
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060] hidden lg:table-cell">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#141414] transition-colors">
                  <td className="px-4 py-2.5 text-[#606060] whitespace-nowrap">
                    {fmtDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-mono font-medium ${actionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#a0a0a0] hidden sm:table-cell">
                    {log.resourceName ?? log.resourceId ?? log.resource ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[#a0a0a0] hidden md:table-cell">
                    {log.user.name ?? log.user.email}
                  </td>
                  <td className="px-4 py-2.5 text-[#606060] font-mono hidden lg:table-cell">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#1f1f1f] px-4 py-3">
              <button
                onClick={() => void fetch_(page - 1)}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </button>
              <span className="text-xs text-[#606060]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => void fetch_(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] disabled:opacity-40 transition-colors"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
