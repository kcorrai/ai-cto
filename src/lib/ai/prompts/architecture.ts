// v1 — 2026-06-12

import type { RepoBundle } from "@/lib/github/fetcher";
import { buildFrameworkContext } from "./shared";

const CONTENT_CHAR_LIMIT = 2_000;

// Files most relevant for architecture assessment
const ARCH_PRIORITY_PATTERNS = [
  /^(index|app|main|server)\.(ts|tsx|js|jsx|py|go)$/i,
  /next\.config\.(ts|js|mjs)$/i,
  /package\.json$/i,
  /tsconfig\.json$/i,
  /docker-compose\.(yml|yaml)$/i,
  /schema\.prisma$/i,
  /\/(middleware|proxy)\.(ts|js)$/i,
  /\/(routes?|router)\.(ts|js)$/i,
];

function isArchKeyFile(path: string): boolean {
  const filename = path.split("/").pop() ?? "";
  return ARCH_PRIORITY_PATTERNS.some((p) => p.test(filename) || p.test(path));
}

export function buildArchitectureSystemPrompt(): string {
  return `You are a senior software architect performing a technical architecture review.

Your goal: evaluate structural design quality and return a precise JSON object.

Scoring guide:
- 85–100: Clean architecture, clear separation, appropriate patterns, scalable design
- 65–84: Good structure with minor issues worth addressing
- 45–64: Moderate concerns — patterns unclear, some entanglement, limited scalability
- 25–44: Major structural problems — tight coupling, poor separation, anti-patterns present
- 0–24: Fundamental architectural problems that impede development

Rules you MUST follow:
- Every finding's filePath MUST be an exact path from the "Available file paths" list
- Do NOT fabricate file paths — if you cannot cite a real path, omit the filePath field
- Do NOT give generic advice without a specific location (e.g., "add error handling" is invalid without filePath)
- If a concern does not apply to this codebase, omit it rather than forcing a finding
- strengths: list 2–5 genuine positive aspects, be specific not generic
- pattern: name the primary architectural pattern you observe (e.g., "Next.js App Router", "MVC", "Layered", "Monolith", "Event-driven", "Microservices")`;
}

export function buildArchitectureUserPrompt(bundle: RepoBundle): string {
  const { repoMetadata, files, totalFilesInRepo, selectedFileCount } = bundle;

  if (files.length === 0) {
    return `Analyze architecture of an empty repository: ${repoMetadata.fullName}. No files to evaluate — score should be 0, pattern "Empty", no findings.`;
  }

  // Build file tree (directory structure)
  const dirs = new Map<string, string[]>();
  for (const f of files) {
    const parts = f.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "(root)";
    if (!dirs.has(dir)) dirs.set(dir, []);
    dirs.get(dir)!.push(parts.at(-1)!);
  }
  const fileTree = Array.from(dirs.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dir, fnames]) => `${dir}/\n${fnames.map((n) => `  ${n}`).join("\n")}`)
    .join("\n");

  // Key file contents (entry points, config, routing)
  const keyFiles = files.filter((f) => isArchKeyFile(f.path)).slice(0, 15);

  // Fill remaining slots with top-scored API/service files
  const remaining = files
    .filter((f) => !keyFiles.includes(f) && (f.path.includes("/api/") || f.path.includes("/lib/")))
    .slice(0, 20 - keyFiles.length);

  const displayFiles = [...keyFiles, ...remaining];

  const fileContents = displayFiles
    .map((f) => {
      const content =
        f.content.length > CONTENT_CHAR_LIMIT
          ? f.content.slice(0, CONTENT_CHAR_LIMIT) + "\n... (truncated)"
          : f.content;
      return `### ${f.path}\n\`\`\`\n${content}\n\`\`\``;
    })
    .join("\n\n");

  const allPaths = files.map((f) => f.path).join("\n");

  return `Analyze the architecture of this codebase.

## Repository
Name: ${repoMetadata.fullName}
Primary language: ${repoMetadata.language ?? "Unknown"}
${buildFrameworkContext(bundle)}Total files in repo: ${totalFilesInRepo}
Files analyzed: ${selectedFileCount}

## File Tree
\`\`\`
${fileTree}
\`\`\`

## Key File Contents
${fileContents}

## Available file paths (use ONLY these for findings.filePath)
\`\`\`
${allPaths}
\`\`\``;
}
