// Maps changed file paths to the analysis modules most likely affected.
// Used by continuous monitoring to avoid running all modules on every push.

const MODULE_FILE_PATTERNS: Record<string, RegExp[]> = {
  architecture: [/\.(ts|tsx|js|jsx|py|go|rs|java)$/, /next\.config/, /vite\.config/, /webpack/],
  code_quality: [/\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/],
  security: [
    /\.(ts|tsx|js|jsx|py|go|rs)$/,
    /middleware/,
    /auth/,
    /crypto/,
    /\.env\.example/,
    /secrets/,
  ],
  performance: [/\.(ts|tsx|js|jsx|py)$/, /cache/, /redis/, /worker/],
  testing: [/\.(test|spec)\.(ts|tsx|js|jsx|py)$/, /jest\.config/, /vitest\.config/, /__tests__/],
  documentation: [/\.(md|mdx|rst|txt)$/, /README/, /CHANGELOG/, /docs\//i],
  dependencies: [
    /package\.json$/,
    /requirements\.txt$/,
    /Gemfile$/,
    /go\.mod$/,
    /Cargo\.toml$/,
    /pnpm-lock/,
    /yarn\.lock/,
    /package-lock/,
  ],
  api_design: [/\/api\//, /route\.(ts|js)$/, /controller/, /handler/],
  database: [/prisma\/schema/, /migration/, /models?\//, /schema\.(ts|py|rb)/, /alembic/],
  devops: [
    /\.github\/workflows/,
    /Dockerfile/,
    /docker-compose/,
    /\.yml$/,
    /\.yaml$/,
    /kubernetes/,
    /k8s/,
    /terraform/,
    /\.tf$/,
  ],
  product_readiness: [
    /\/(app|pages)\/.*page\.(tsx|jsx|ts|js)$/,
    /layout\.(tsx|jsx)$/,
    /sign-in/,
    /sign-up/,
    /onboard/,
  ],
  saas_maturity: [/prisma\/schema/, /stripe/, /billing/, /subscription/, /webhook/],
  product_manager: [/\/(app|pages)\/.*page\.(tsx|jsx|ts|js)$/, /component/, /feature/],
  market_intelligence: [/README/, /package\.json$/, /prisma\/schema/, /pricing/, /landing/],
  team_advisor: [
    /\.github\/workflows/,
    /jest\.config/,
    /vitest\.config/,
    /\.eslintrc/,
    /tsconfig/,
    /Dockerfile/,
  ],
};

export function getAffectedModules(changedFiles: string[]): string[] | null {
  if (changedFiles.length === 0) return null;

  // If too many files changed or diverse set, run all modules
  if (changedFiles.length > 50) return null;

  const affected = new Set<string>();

  for (const file of changedFiles) {
    for (const [module, patterns] of Object.entries(MODULE_FILE_PATTERNS)) {
      if (patterns.some((re) => re.test(file))) {
        affected.add(module);
      }
    }
  }

  // Always include security and code_quality for any non-trivial code change
  const hasCode = changedFiles.some((f) => /\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/.test(f));
  if (hasCode) {
    affected.add("security");
    affected.add("code_quality");
  }

  // If < 3 modules affected, just run all (overhead not worth the complexity)
  if (affected.size < 3) return null;

  return [...affected];
}
