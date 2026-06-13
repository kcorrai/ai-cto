import { db } from "@/lib/db";
import { getGitHubClient } from "@/lib/github/client";
import { env } from "@/env";
import { put } from "@vercel/blob";

const MAX_FILES = 100;
const MAX_FILE_SIZE = 50 * 1024; // 50KB
const MIN_TEST_FILES = 8; // guaranteed test file slots

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".bmp",
  ".tiff",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".mp3",
  ".mp4",
  ".wav",
  ".ogg",
  ".flac",
  ".webm",
  ".avi",
  ".mov",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".bz2",
  ".rar",
  ".xz",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".o",
  ".a",
  ".db",
  ".sqlite",
  ".sqlite3",
  ".pyc",
  ".class",
  ".jar",
  ".war",
]);

// Lockfiles are large and carry no signal for code analysis
const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "gemfile.lock",
  "poetry.lock",
  "cargo.lock",
  "go.sum",
  "packages.lock.json",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "__pycache__",
  ".pnp",
  "vendor",
  "coverage",
  ".nyc_output",
  ".turbo",
  ".vercel",
  ".cache",
]);

export type RepoFile = {
  path: string;
  content: string;
  size: number;
};

export type RepoBundle = {
  projectId: string;
  analysisId: string;
  fetchedAt: string;
  repoMetadata: {
    owner: string;
    name: string;
    fullName: string;
    defaultBranch: string;
    language: string | null;
    size: number;
    starCount: number;
    forkCount: number;
  };
  files: RepoFile[];
  totalFilesInRepo: number;
  selectedFileCount: number;
  blobPath: string;
  frameworkHints: string[];
};

function detectFrameworks(paths: string[]): string[] {
  const hints: string[] = [];
  const pathSet = new Set(paths.map((p) => p.toLowerCase()));
  const has = (fragment: string) => [...pathSet].some((p) => p.includes(fragment));

  if (
    pathSet.has("next.config.ts") ||
    pathSet.has("next.config.js") ||
    pathSet.has("next.config.mjs")
  )
    hints.push("next.js");
  if (pathSet.has("nuxt.config.ts") || pathSet.has("nuxt.config.js")) hints.push("nuxt");
  if (pathSet.has("svelte.config.js") || pathSet.has("svelte.config.ts")) hints.push("sveltekit");
  if (pathSet.has("remix.config.js") || has("/app/routes/")) hints.push("remix");
  if (pathSet.has("astro.config.mjs") || pathSet.has("astro.config.ts")) hints.push("astro");
  if (pathSet.has("vite.config.ts") || pathSet.has("vite.config.js")) hints.push("vite");
  if (pathSet.has("schema.prisma") || has("prisma/schema")) hints.push("prisma");
  if (has("drizzle.config")) hints.push("drizzle");
  if (
    pathSet.has("docker-compose.yml") ||
    pathSet.has("docker-compose.yaml") ||
    pathSet.has("dockerfile")
  )
    hints.push("docker");
  if (has(".github/workflows/")) hints.push("github-actions");
  if (pathSet.has("go.mod")) hints.push("go");
  if (pathSet.has("cargo.toml")) hints.push("rust");
  if (pathSet.has("pyproject.toml") || pathSet.has("requirements.txt")) hints.push("python");
  if (pathSet.has("gemfile")) hints.push("ruby");

  return hints;
}

function getExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  const lastSlash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (lastDot <= lastSlash || lastDot === -1) return "";
  return path.slice(lastDot).toLowerCase();
}

function isBinary(path: string): boolean {
  return BINARY_EXTENSIONS.has(getExtension(path));
}

function isLockfile(path: string): boolean {
  const filename = path.split("/").pop()?.toLowerCase() ?? "";
  return LOCKFILES.has(filename);
}

function isInSkippedDir(path: string): boolean {
  return path.split("/").some((part) => SKIP_DIRS.has(part));
}

function scoreFile(path: string): number {
  const lower = path.toLowerCase();
  const filename = lower.split("/").pop() ?? "";
  const ext = getExtension(filename);

  // Entry points — 100
  const entryPoints = new Set([
    "index.ts",
    "index.tsx",
    "index.js",
    "index.jsx",
    "app.ts",
    "app.js",
    "main.ts",
    "main.py",
    "main.go",
    "server.ts",
    "server.js",
    "index.py",
  ]);
  if (entryPoints.has(filename)) return 100;

  // Config files — 90
  const configFiles = [
    "package.json",
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    ".env.example",
    ".env.sample",
    "tsconfig.json",
    "schema.prisma",
    "docker-compose.yml",
    "docker-compose.yaml",
    "go.mod",
    "pyproject.toml",
    "cargo.toml",
    "gemfile",
    "pom.xml",
    "build.gradle",
  ];
  if (configFiles.some((c) => lower.endsWith(c))) return 90;

  // README — 85
  if (filename.startsWith("readme")) return 85;

  // Database schemas — 82
  if (
    lower.endsWith("schema.prisma") ||
    lower.endsWith("schema.sql") ||
    lower.includes("migration")
  )
    return 82;

  // Core business logic — 80
  if (
    lower.includes("/api/") ||
    lower.includes("/services/") ||
    lower.includes("/lib/") ||
    lower.includes("/handlers/") ||
    lower.includes("/controllers/") ||
    lower.includes("/routes/") ||
    lower.includes("/core/")
  ) {
    return 80;
  }

  // Domain models and schemas — 75
  if (
    lower.includes("schema") ||
    lower.includes("model") ||
    lower.includes("types") ||
    lower.includes("interfaces") ||
    lower.includes("entities")
  ) {
    return 75;
  }

  // CI/CD — 70
  if (
    lower.includes(".github/workflows") ||
    lower.includes(".gitlab-ci") ||
    filename === "makefile" ||
    filename === "dockerfile"
  ) {
    return 70;
  }

  // Source files — 50
  const sourceExts = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".go",
    ".rs",
    ".rb",
    ".java",
    ".kt",
    ".swift",
    ".cs",
    ".php",
  ]);
  if (sourceExts.has(ext)) return 50;

  // Test files — lower priority (sample only)
  if (
    lower.includes("/test") ||
    lower.includes("/__tests__") ||
    lower.includes(".test.") ||
    lower.includes(".spec.")
  ) {
    return 10;
  }

  // Docs — 30
  if (ext === ".md" || ext === ".mdx") return 30;

  // Config-like — 20
  if ([".json", ".yaml", ".yml", ".toml", ".ini"].includes(ext)) return 20;

  return 5;
}

export async function fetchRepository(
  projectId: string,
  userId: string,
  analysisId: string
): Promise<RepoBundle> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubOwner: true, githubRepo: true, githubBranch: true },
  });
  if (!project) throw new Error(`Project ${projectId} not found`);
  const { githubOwner, githubRepo, githubBranch } = project;
  if (!githubOwner || !githubRepo || !githubBranch) {
    throw new Error(`Project ${projectId} is not linked to a GitHub repository`);
  }
  const owner = githubOwner;
  const repo = githubRepo;
  const branch = githubBranch;

  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured — set it up in Vercel Blob");
  }

  const octokit = await getGitHubClient(userId);

  // 1. Fetch repo metadata
  const { data: repoData } = await octokit.repos.get({ owner, repo });

  // 2. Get branch HEAD tree SHA
  const { data: branchData } = await octokit.repos.getBranch({ owner, repo, branch });
  const treeSha = branchData.commit.commit.tree.sha;

  // 3. Fetch full recursive file tree
  const { data: treeData } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "1",
  });

  const allBlobs = (treeData.tree ?? []).filter((f) => f.type === "blob");
  const totalFilesInRepo = allBlobs.length;

  // Empty repo — return empty bundle
  if (totalFilesInRepo === 0) {
    const blobPath = `analyses/${analysisId}/repo-bundle.json`;
    const bundle: RepoBundle = {
      projectId,
      analysisId,
      fetchedAt: new Date().toISOString(),
      repoMetadata: {
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        defaultBranch: repoData.default_branch,
        language: repoData.language ?? null,
        size: repoData.size,
        starCount: repoData.stargazers_count,
        forkCount: repoData.forks_count,
      },
      files: [],
      totalFilesInRepo: 0,
      selectedFileCount: 0,
      blobPath,
      frameworkHints: [],
    };
    await put(blobPath, JSON.stringify(bundle), { access: "private", addRandomSuffix: false });
    return bundle;
  }

  // 4. Filter and score candidate files
  const candidates = allBlobs.filter(
    (f) =>
      f.path != null &&
      !isBinary(f.path) &&
      !isLockfile(f.path) &&
      !isInSkippedDir(f.path) &&
      (f.size ?? 0) <= MAX_FILE_SIZE
  );

  const scored = candidates
    .map((f) => ({ path: f.path!, size: f.size ?? 0, score: scoreFile(f.path!) }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  // Separate test files so we can guarantee a minimum quota
  const isTestFile = (p: string) =>
    p.toLowerCase().includes("/test") ||
    p.toLowerCase().includes("/__tests__") ||
    p.toLowerCase().includes(".test.") ||
    p.toLowerCase().includes(".spec.");

  const testFiles = scored.filter((f) => isTestFile(f.path));
  const nonTestFiles = scored.filter((f) => !isTestFile(f.path));

  // Reserve slots: main budget minus test quota, then fill test quota
  const mainBudget = MAX_FILES - MIN_TEST_FILES;
  const mainSelection = nonTestFiles.slice(0, mainBudget);
  const testSelection = testFiles.slice(0, MIN_TEST_FILES);

  // Directory diversity pass: ensure each top-level dir has ≥1 file
  const coveredDirs = new Set(mainSelection.map((f) => f.path.split("/")[0] ?? ""));
  const diversitySlots: typeof scored = [];
  for (const f of nonTestFiles) {
    const topDir = f.path.split("/")[0] ?? "";
    if (!coveredDirs.has(topDir)) {
      coveredDirs.add(topDir);
      diversitySlots.push(f);
    }
  }

  const combined = new Map<string, (typeof scored)[number]>();
  for (const f of [...mainSelection, ...diversitySlots, ...testSelection]) {
    combined.set(f.path, f);
  }
  const selected = [...combined.values()].slice(0, MAX_FILES);

  // 5. Fetch contents in parallel batches of 10
  const BATCH_SIZE = 10;
  const files: RepoFile[] = [];

  for (let i = 0; i < selected.length; i += BATCH_SIZE) {
    const batch = selected.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async ({ path, size }) => {
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
          if (Array.isArray(data) || data.type !== "file") return null;
          const content = Buffer.from(data.content, "base64").toString("utf8");
          if (content.includes("\x00")) return null; // null bytes = binary
          return { path, content, size } satisfies RepoFile;
        } catch {
          return null;
        }
      })
    );
    files.push(...results.filter((r): r is RepoFile => r !== null));
  }

  // 6. Store bundle in Vercel Blob
  const blobPath = `analyses/${analysisId}/repo-bundle.json`;

  const frameworkHints = detectFrameworks(files.map((f) => f.path));

  const bundle: RepoBundle = {
    projectId,
    analysisId,
    fetchedAt: new Date().toISOString(),
    repoMetadata: {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      defaultBranch: repoData.default_branch,
      language: repoData.language ?? null,
      size: repoData.size,
      starCount: repoData.stargazers_count,
      forkCount: repoData.forks_count,
    },
    files,
    totalFilesInRepo,
    selectedFileCount: files.length,
    blobPath,
    frameworkHints,
  };

  await put(blobPath, JSON.stringify(bundle), { access: "private", addRandomSuffix: false });

  return bundle;
}
