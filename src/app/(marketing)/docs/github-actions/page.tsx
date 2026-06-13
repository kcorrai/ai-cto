import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GitHub Actions Integration — AI CTO",
  description:
    "Trigger AI CTO analyses automatically on every push to main. Set up in under 5 minutes.",
};

const WORKFLOW_YAML = `name: AI CTO Analysis

on:
  push:
    branches:
      - main

  # Optional: also run on pull requests
  # pull_request:
  #   branches:
  #     - main

jobs:
  analyze:
    name: Run AI CTO Analysis
    runs-on: ubuntu-latest

    steps:
      - name: Trigger AI CTO analysis
        run: |
          RESPONSE=$(curl -s -w "\\n%{http_code}" \\
            -X POST "https://aicto.dev/api/v1/projects/\${{ vars.AICTO_PROJECT_ID }}/analyses" \\
            -H "Authorization: Bearer \${{ secrets.AICTO_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"trigger":"ci"}')

          HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
          BODY=$(echo "$RESPONSE" | head -n-1)

          echo "Response: $BODY"

          if [ "$HTTP_CODE" -ne 200 ] && [ "$HTTP_CODE" -ne 201 ]; then
            echo "Error: AI CTO analysis trigger failed (HTTP $HTTP_CODE)"
            exit 1
          fi

          echo "Analysis triggered successfully."
          echo "View: https://aicto.dev/projects/\${{ vars.AICTO_PROJECT_ID }}/analysis"`;

const STEPS = [
  {
    number: "01",
    title: "Create an API key",
    description: (
      <>
        Go to{" "}
        <Link href="/settings" className="text-[#3b82f6] hover:underline">
          Settings → API Keys
        </Link>{" "}
        and generate a new key. Copy it — you won&apos;t see it again.
      </>
    ),
  },
  {
    number: "02",
    title: "Find your Project ID",
    description:
      "Open any project in AI CTO. Your Project ID is the UUID in the URL: /projects/{PROJECT_ID}/overview",
  },
  {
    number: "03",
    title: "Add GitHub secrets and variables",
    description:
      "In your GitHub repo: Settings → Secrets and variables → Actions. Add AICTO_API_KEY as a Secret and AICTO_PROJECT_ID as a Variable.",
  },
  {
    number: "04",
    title: "Add the workflow file",
    description:
      "Copy the YAML below into .github/workflows/ai-cto.yml in your repository. Commit and push — the first analysis triggers immediately.",
  },
];

export default function GitHubActionsDocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[#606060]">
            <Link href="/docs/api" className="hover:text-[#3b82f6]">
              Docs
            </Link>
            <span>/</span>
            <span className="text-[#a0a0a0]">GitHub Actions</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#f0f0f0]">
            GitHub Actions Integration
          </h1>
          <p className="mt-3 max-w-xl text-base text-[#a0a0a0]">
            Trigger an AI CTO analysis automatically on every push to{" "}
            <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 font-mono text-sm text-[#f0f0f0]">
              main
            </code>
            . Get a fresh report every time you ship.
          </p>
        </div>

        {/* Setup steps */}
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-[#f0f0f0]">Setup guide</h2>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex gap-5 rounded-xl border border-[#2a2a2a] bg-[#111111] p-5"
              >
                <span className="shrink-0 font-mono text-sm font-bold text-[#3b82f6]">
                  {step.number}
                </span>
                <div>
                  <p className="font-medium text-[#f0f0f0]">{step.title}</p>
                  <p className="mt-1 text-sm text-[#a0a0a0]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow YAML */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#f0f0f0]">Workflow file</h2>
            <span className="font-mono text-xs text-[#606060]">.github/workflows/ai-cto.yml</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#060606]">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-2.5">
              <span className="font-mono text-xs text-[#505050]">yaml</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-[#a0a0a0]">
              <code>{WORKFLOW_YAML}</code>
            </pre>
          </div>
        </section>

        {/* Required config */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-[#f0f0f0]">Required configuration</h2>
          <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#111111]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#606060]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-[#f0f0f0]">AICTO_API_KEY</td>
                  <td className="px-4 py-3 text-xs text-[#606060]">Secret</td>
                  <td className="px-4 py-3 text-xs text-[#a0a0a0]">
                    Your AI CTO API key (from Settings → API Keys)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-[#f0f0f0]">AICTO_PROJECT_ID</td>
                  <td className="px-4 py-3 text-xs text-[#606060]">Variable</td>
                  <td className="px-4 py-3 text-xs text-[#a0a0a0]">
                    The UUID of your AI CTO project (from the project URL)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* API reference link */}
        <div className="flex items-center gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] px-5 py-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#f0f0f0]">Full API reference</p>
            <p className="mt-0.5 text-xs text-[#606060]">
              Explore all available endpoints, authentication, and response formats.
            </p>
          </div>
          <Link
            href="/docs/api"
            className="shrink-0 rounded-md bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] transition-colors hover:border-[#404040] hover:text-[#f0f0f0] border border-[#2a2a2a]"
          >
            View docs →
          </Link>
        </div>
      </div>
    </div>
  );
}
