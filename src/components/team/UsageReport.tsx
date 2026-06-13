"use client";

import { useState, useEffect } from "react";
import { Download, RefreshCw, BarChart2, Users, FolderKanban } from "lucide-react";

type MonthlyBucket = { month: string; analyses: number };
type UserUsage = { userId: string; name: string | null; email: string; analyses: number };
type ProjectUsage = { projectId: string; name: string; analyses: number };

type Report = {
  period: { from: string; to: string; months: number };
  totalMembers: number;
  totalAnalyses: number;
  monthlyTrend: MonthlyBucket[];
  byUser: UserUsage[];
  byProject: ProjectUsage[];
};

export function UsageReport() {
  const [months, setMonths] = useState(3);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchReport(m: number) {
    setLoading(true);
    void fetch(`/api/orgs/usage?months=${m}`)
      .then((res) => (res.ok ? (res.json() as Promise<Report>) : null))
      .then((data) => {
        if (data) setReport(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    void fetch(`/api/orgs/usage?months=3`)
      .then((res) => (res.ok ? (res.json() as Promise<Report>) : null))
      .then((data) => {
        if (data) setReport(data);
        setLoading(false);
      });
  }, []);

  function handleMonthsChange(m: number) {
    setMonths(m);
    fetchReport(m);
  }

  function refresh() {
    fetchReport(months);
  }

  function exportCsv() {
    window.location.href = `/api/orgs/usage?months=${months}&format=csv`;
  }

  const maxAnalyses = Math.max(1, ...(report?.monthlyTrend.map((b) => b.analyses) ?? [0]));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <select
          value={months}
          onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
          className="rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1.5 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
        >
          <option value={1}>Last month</option>
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:text-[#f0f0f0] disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        {report && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] ml-auto transition-colors"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#606060]">
          <BarChart2 className="h-6 w-6 animate-pulse" />
        </div>
      ) : !report ? (
        <div className="flex items-center justify-center py-20 text-[#606060]">
          <BarChart2 className="h-6 w-6" />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="h-3.5 w-3.5 text-[#606060]" />
                <span className="text-xs text-[#606060]">Total Analyses</span>
              </div>
              <p className="text-2xl font-semibold text-[#f0f0f0]">{report.totalAnalyses}</p>
            </div>
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-[#606060]" />
                <span className="text-xs text-[#606060]">Total Members</span>
              </div>
              <p className="text-2xl font-semibold text-[#f0f0f0]">{report.totalMembers}</p>
            </div>
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban className="h-3.5 w-3.5 text-[#606060]" />
                <span className="text-xs text-[#606060]">Avg / Month</span>
              </div>
              <p className="text-2xl font-semibold text-[#f0f0f0]">
                {months > 0 ? Math.round(report.totalAnalyses / months) : 0}
              </p>
            </div>
          </div>

          {/* Monthly trend bar chart */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
            <h3 className="mb-4 text-xs font-medium text-[#d0d0d0]">Monthly Trend</h3>
            <div className="flex items-end gap-2 h-32">
              {report.monthlyTrend.map((b) => (
                <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-[#3b82f6]/60 transition-all"
                    style={{ height: `${Math.max(4, (b.analyses / maxAnalyses) * 100)}%` }}
                  />
                  <span className="text-[9px] text-[#606060] whitespace-nowrap">{b.month}</span>
                  <span className="text-[9px] text-[#a0a0a0]">{b.analyses}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-user */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1f1f1f]">
              <h3 className="text-xs font-medium text-[#d0d0d0]">By User</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="px-4 py-2 text-left font-medium text-[#606060]">User</th>
                  <th className="px-4 py-2 text-right font-medium text-[#606060]">Analyses</th>
                  <th className="px-4 py-2 text-right font-medium text-[#606060]">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {report.byUser.map((u) => (
                  <tr key={u.userId} className="hover:bg-[#141414]">
                    <td className="px-4 py-2.5">
                      <p className="text-[#d0d0d0]">{u.name ?? u.email}</p>
                      {u.name && <p className="text-[10px] text-[#606060]">{u.email}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#a0a0a0]">{u.analyses}</td>
                    <td className="px-4 py-2.5 text-right text-[#606060]">
                      {report.totalAnalyses > 0
                        ? `${Math.round((u.analyses / report.totalAnalyses) * 100)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-project */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1f1f1f]">
              <h3 className="text-xs font-medium text-[#d0d0d0]">Top Projects</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="px-4 py-2 text-left font-medium text-[#606060]">Project</th>
                  <th className="px-4 py-2 text-right font-medium text-[#606060]">Analyses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {report.byProject.map((p) => (
                  <tr key={p.projectId} className="hover:bg-[#141414]">
                    <td className="px-4 py-2.5 text-[#d0d0d0]">{p.name}</td>
                    <td className="px-4 py-2.5 text-right text-[#a0a0a0]">{p.analyses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
