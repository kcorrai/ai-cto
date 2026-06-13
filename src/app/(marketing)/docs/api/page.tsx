import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Documentation — AI CTO",
  description:
    "REST API reference for AI CTO. Programmatically manage projects, trigger analyses, and retrieve findings.",
};

const ENDPOINTS = [
  {
    group: "Projects",
    items: [
      { method: "GET", path: "/v1/projects", desc: "List all projects" },
      { method: "POST", path: "/v1/projects", desc: "Create a project" },
      { method: "GET", path: "/v1/projects/:id", desc: "Get a project" },
      { method: "GET", path: "/v1/projects/:id/score", desc: "Get current score" },
      { method: "GET", path: "/v1/projects/:id/analyses", desc: "List analyses for a project" },
      { method: "POST", path: "/v1/projects/:id/analyses", desc: "Trigger an analysis" },
    ],
  },
  {
    group: "Analyses",
    items: [
      { method: "GET", path: "/v1/analyses/:id", desc: "Get an analysis" },
      { method: "GET", path: "/v1/analyses/:id/findings", desc: "Get findings for an analysis" },
    ],
  },
];

const METHOD_COLOR: Record<string, string> = {
  GET: "#22c55e",
  POST: "#3b82f6",
  DELETE: "#ef4444",
  PATCH: "#f59e0b",
};

const CODE_EXAMPLES = {
  curl: `curl https://aicto.dev/api/v1/projects \\
  -H "Authorization: Bearer aicto_live_..."`,
  typescript: `const res = await fetch("https://aicto.dev/api/v1/projects", {
  headers: {
    Authorization: \`Bearer \${process.env.AICTO_API_KEY}\`,
  },
});
const { data } = await res.json();`,
  python: `import requests

resp = requests.get(
    "https://aicto.dev/api/v1/projects",
    headers={"Authorization": f"Bearer {api_key}"},
)
data = resp.json()["data"]`,
};

const RESPONSE_EXAMPLE = `{
  "data": [
    {
      "id": "01234567-...",
      "name": "my-saas",
      "githubOwner": "acme",
      "githubRepo": "my-saas",
      "latestScore": 74,
      "analysisCount": 3,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "hasMore": false,
    "nextCursor": null
  },
  "error": null
}`;

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#3b82f6]">
            Developer Docs
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#f0f0f0]">
            API Reference
          </h1>
          <p className="mt-3 max-w-xl text-base text-[#a0a0a0]">
            Programmatically manage projects, trigger analyses, and retrieve findings. Requires a
            Pro plan.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* Sidebar nav */}
          <nav className="space-y-6">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-[#606060]">
                Getting started
              </p>
              <ul className="space-y-1.5 text-sm text-[#a0a0a0]">
                <li>
                  <a href="#authentication" className="hover:text-[#f0f0f0]">
                    Authentication
                  </a>
                </li>
                <li>
                  <a href="#base-url" className="hover:text-[#f0f0f0]">
                    Base URL
                  </a>
                </li>
                <li>
                  <a href="#responses" className="hover:text-[#f0f0f0]">
                    Response format
                  </a>
                </li>
                <li>
                  <a href="#pagination" className="hover:text-[#f0f0f0]">
                    Pagination
                  </a>
                </li>
                <li>
                  <a href="#rate-limits" className="hover:text-[#f0f0f0]">
                    Rate limits
                  </a>
                </li>
              </ul>
            </div>
            {ENDPOINTS.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-[#606060]">
                  {g.group}
                </p>
                <ul className="space-y-1.5 text-sm text-[#a0a0a0]">
                  {g.items.map((e) => (
                    <li key={`${e.method}${e.path}`}>
                      <a
                        href={`#${e.method.toLowerCase()}-${e.path.replace(/[/:]/g, "-")}`}
                        className="hover:text-[#f0f0f0]"
                      >
                        {e.desc}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Content */}
          <div className="min-w-0 space-y-14">
            {/* Authentication */}
            <section id="authentication">
              <h2 className="mb-4 text-xl font-semibold text-[#f0f0f0]">Authentication</h2>
              <p className="mb-4 text-sm text-[#a0a0a0]">
                All API requests must include an{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  Authorization
                </code>{" "}
                header with a Bearer token. Create API keys in your{" "}
                <Link href="/settings" className="text-[#3b82f6] hover:underline">
                  Settings → API Keys
                </Link>
                .
              </p>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
                <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[#606060]">
                    curl
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[#a0a0a0]">
                  <code>{CODE_EXAMPLES.curl}</code>
                </pre>
              </div>
            </section>

            {/* Base URL */}
            <section id="base-url">
              <h2 className="mb-4 text-xl font-semibold text-[#f0f0f0]">Base URL</h2>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3">
                <code className="text-sm text-[#22c55e]">https://aicto.dev/api</code>
              </div>
            </section>

            {/* Code examples */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-[#f0f0f0]">Code examples</h2>
              {(["curl", "typescript", "python"] as const).map((lang) => (
                <div key={lang} className="mb-4 rounded-xl border border-[#2a2a2a] bg-[#111111]">
                  <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-4 py-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#606060]">
                      {lang}
                    </span>
                  </div>
                  <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[#a0a0a0]">
                    <code>{CODE_EXAMPLES[lang]}</code>
                  </pre>
                </div>
              ))}
            </section>

            {/* Response format */}
            <section id="responses">
              <h2 className="mb-4 text-xl font-semibold text-[#f0f0f0]">Response format</h2>
              <p className="mb-4 text-sm text-[#a0a0a0]">
                All responses use the envelope format:{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  {"{ data, meta, error }"}
                </code>
                . On success,{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  error
                </code>{" "}
                is{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  null
                </code>
                . On failure,{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  data
                </code>{" "}
                is{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  null
                </code>
                .
              </p>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#111111]">
                <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-[#606060]">
                    Example response
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[#a0a0a0]">
                  <code>{RESPONSE_EXAMPLE}</code>
                </pre>
              </div>
            </section>

            {/* Pagination */}
            <section id="pagination">
              <h2 className="mb-4 text-xl font-semibold text-[#f0f0f0]">Pagination</h2>
              <p className="mb-4 text-sm text-[#a0a0a0]">
                List endpoints use cursor-based pagination. Pass the{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  nextCursor
                </code>{" "}
                from{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  meta
                </code>{" "}
                as the{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  cursor
                </code>{" "}
                query param for the next page. Default page size is 20, maximum is 100 (use the{" "}
                <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#f0f0f0]">
                  limit
                </code>{" "}
                param).
              </p>
            </section>

            {/* Rate limits */}
            <section id="rate-limits">
              <h2 className="mb-4 text-xl font-semibold text-[#f0f0f0]">Rate limits</h2>
              <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a2a2a] bg-[#111111]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#606060]">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#606060]">
                        Requests / hour
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {[
                      { plan: "Pro", limit: "100" },
                      { plan: "Team", limit: "500" },
                      { plan: "Enterprise", limit: "Custom" },
                    ].map((r) => (
                      <tr key={r.plan} className="bg-[#0a0a0a]">
                        <td className="px-4 py-3 text-sm text-[#f0f0f0]">{r.plan}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-[#a0a0a0]">{r.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-[#606060]">
                Rate limit headers are included on every response:{" "}
                <code className="text-[#a0a0a0]">X-RateLimit-Limit</code>,{" "}
                <code className="text-[#a0a0a0]">X-RateLimit-Remaining</code>,{" "}
                <code className="text-[#a0a0a0]">X-RateLimit-Reset</code>.
              </p>
            </section>

            {/* Endpoint listing */}
            {ENDPOINTS.map((g) => (
              <section key={g.group}>
                <h2 className="mb-6 text-xl font-semibold text-[#f0f0f0]">{g.group}</h2>
                <div className="space-y-6">
                  {g.items.map((e) => {
                    const anchorId = `${e.method.toLowerCase()}-${e.path.replace(/[/:]/g, "-")}`;
                    return (
                      <div
                        key={anchorId}
                        id={anchorId}
                        className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="rounded px-2 py-0.5 text-xs font-bold tabular-nums"
                            style={{
                              color: METHOD_COLOR[e.method],
                              backgroundColor: `${METHOD_COLOR[e.method]}18`,
                            }}
                          >
                            {e.method}
                          </span>
                          <code className="text-sm font-medium text-[#f0f0f0]">/api{e.path}</code>
                        </div>
                        <p className="mt-2 text-sm text-[#a0a0a0]">{e.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
