import type { RepoBundle } from "@/lib/github/fetcher";

export function buildFrameworkContext(bundle: RepoBundle): string {
  if (!bundle.frameworkHints?.length) return "";
  return `Detected frameworks/tools: ${bundle.frameworkHints.join(", ")}\n`;
}
