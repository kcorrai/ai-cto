"use client";

import { useState } from "react";
import { Upload, Github, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

type Repo = {
  name: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  isPrivate: boolean;
  language: string | undefined;
};

type ImportResult = {
  name: string;
  status: "created" | "exists" | "error";
  projectId?: string;
  error?: string;
};

type ApiResponse = {
  total: number;
  created: number;
  alreadyExists: number;
  errors: number;
  results: ImportResult[];
};

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (!match?.[1] || !match?.[2]) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

function parseCsv(text: string): Repo[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const repos: Repo[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const url = cols[0] ?? "";
    const parsed = parseGitHubUrl(url);
    if (!parsed) continue;
    repos.push({
      name: cols[1] ?? `${parsed.owner}/${parsed.repo}`,
      githubOwner: parsed.owner,
      githubRepo: parsed.repo,
      githubBranch: cols[2] ?? "main",
      isPrivate: cols[3]?.toLowerCase() === "true",
      language: cols[4],
    });
  }
  return repos;
}

export function BulkImportUI() {
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [githubOrgInput, setGithubOrgInput] = useState("");
  const [csvText, setCsvText] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [scheduleAnalysis, setScheduleAnalysis] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse | null>(null);

  function parseRepos() {
    if (mode === "csv") {
      setRepos(parseCsv(csvText));
    } else {
      // Parse from manual multi-line github.com URLs
      const lines = githubOrgInput.split("\n").filter(Boolean);
      const parsed: Repo[] = [];
      for (const line of lines) {
        const info = parseGitHubUrl(line.trim());
        if (info) {
          parsed.push({
            name: `${info.owner}/${info.repo}`,
            githubOwner: info.owner,
            githubRepo: info.repo,
            githubBranch: "main",
            isPrivate: false,
            language: undefined,
          });
        }
      }
      setRepos(parsed);
    }
  }

  async function importRepos() {
    setLoading(true);
    setResults(null);
    const res = await fetch("/api/orgs/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repos, scheduleAnalysis }),
    });
    if (res.ok) {
      const data = (await res.json()) as ApiResponse;
      setResults(data);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["manual", "csv"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setRepos([]);
              setResults(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              mode === m
                ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]"
                : "border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6]"
            }`}
          >
            {m === "manual" ? <Github className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {m === "manual" ? "GitHub URLs" : "CSV Upload"}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4 space-y-3">
        {mode === "manual" ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">
              GitHub Repository URLs (one per line)
            </label>
            <textarea
              value={githubOrgInput}
              onChange={(e) => setGithubOrgInput(e.target.value)}
              placeholder={`https://github.com/org/repo1\nhttps://github.com/org/repo2`}
              rows={6}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none font-mono resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-medium text-[#d0d0d0]">
              CSV Content{" "}
              <span className="text-[#606060] font-normal">
                (columns: url, name, branch, private, language)
              </span>
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`url,name,branch,private,language\nhttps://github.com/org/repo1,My Repo,main,false,TypeScript`}
              rows={8}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none font-mono resize-none"
            />
          </div>
        )}

        <button
          onClick={parseRepos}
          className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
        >
          Preview
        </button>
      </div>

      {/* Preview */}
      {repos.length > 0 && !results && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#d0d0d0]">
              {repos.length} repositories to import
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleAnalysis}
                onChange={(e) => setScheduleAnalysis(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-[#a0a0a0]">Trigger analysis after import</span>
            </label>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {repos.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-[#0d0d0d] px-3 py-1.5">
                <Github className="h-3 w-3 text-[#606060] shrink-0" />
                <span className="text-xs text-[#a0a0a0] font-mono">
                  {r.githubOwner}/{r.githubRepo}
                </span>
                {r.isPrivate && (
                  <span className="text-[10px] text-[#606060] border border-[#2a2a2a] rounded px-1">
                    private
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => void importRepos()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-all"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Import {repos.length} Repositories
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-green-400">{results.created} created</span>
            </div>
            {results.alreadyExists > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400">
                  {results.alreadyExists} already exist
                </span>
              </div>
            )}
            {results.errors > 0 && (
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs text-red-400">{results.errors} failed</span>
              </div>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-[#0d0d0d] px-3 py-1.5">
                {r.status === "created" ? (
                  <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                ) : r.status === "exists" ? (
                  <AlertCircle className="h-3 w-3 text-yellow-400 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                )}
                <span className="text-xs text-[#a0a0a0] flex-1">{r.name}</span>
                {r.error && <span className="text-xs text-red-400">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
