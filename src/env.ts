import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database — Neon PostgreSQL
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),

    // Auth — Clerk
    CLERK_SECRET_KEY: z.string().startsWith("sk_"),
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    // Billing — Stripe (required from TASK-022)
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    STRIPE_PRO_MONTHLY_PRICE_ID: z.string().startsWith("price_").optional(),
    STRIPE_PRO_YEARLY_PRICE_ID: z.string().startsWith("price_").optional(),

    // GitHub OAuth (legacy — used as fallback when App not installed)
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    // GitHub App (preferred — higher rate limits, installation tokens)
    GITHUB_APP_ID: z.string().min(1).optional(),
    GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(), // PEM key, newlines as \n
    GITHUB_APP_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_APP_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_APP_WEBHOOK_SECRET: z.string().min(1).optional(),
    GITHUB_APP_SLUG: z.string().min(1).optional(), // e.g. "ai-cto-app"

    // GitHub token encryption (AES-256-GCM) — must be 64-char hex (32 bytes)
    ENCRYPTION_KEY: z
      .string()
      .length(64)
      .regex(/^[0-9a-f]+$/i),

    // Cache — Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // Storage — Vercel Blob (required from TASK-010)
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

    // AI — Vercel AI Gateway (required from TASK-012)
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),

    // Email — Resend (required from TASK-025)
    RESEND_API_KEY: z.string().startsWith("re_").optional(),

    // GitLab integration (optional)
    GITLAB_CLIENT_ID: z.string().min(1).optional(),
    GITLAB_CLIENT_SECRET: z.string().min(1).optional(),
    GITLAB_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Bitbucket integration (optional)
    BITBUCKET_CLIENT_ID: z.string().min(1).optional(),
    BITBUCKET_CLIENT_SECRET: z.string().min(1).optional(),

    // Linear integration (optional)
    LINEAR_CLIENT_ID: z.string().min(1).optional(),
    LINEAR_CLIENT_SECRET: z.string().min(1).optional(),

    // Jira integration (optional)
    JIRA_CLIENT_ID: z.string().min(1).optional(),
    JIRA_CLIENT_SECRET: z.string().min(1).optional(),

    // Slack integration (optional)
    SLACK_CLIENT_ID: z.string().min(1).optional(),
    SLACK_CLIENT_SECRET: z.string().min(1).optional(),
    SLACK_SIGNING_SECRET: z.string().min(1).optional(),

    // Cron jobs
    CRON_SECRET: z.string().min(1).optional(),
  },

  client: {
    // App
    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Auth — Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
    GITHUB_APP_CLIENT_ID: process.env.GITHUB_APP_CLIENT_ID,
    GITHUB_APP_CLIENT_SECRET: process.env.GITHUB_APP_CLIENT_SECRET,
    GITHUB_APP_WEBHOOK_SECRET: process.env.GITHUB_APP_WEBHOOK_SECRET,
    GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET,
    GITLAB_WEBHOOK_SECRET: process.env.GITLAB_WEBHOOK_SECRET,
    BITBUCKET_CLIENT_ID: process.env.BITBUCKET_CLIENT_ID,
    BITBUCKET_CLIENT_SECRET: process.env.BITBUCKET_CLIENT_SECRET,
    LINEAR_CLIENT_ID: process.env.LINEAR_CLIENT_ID,
    LINEAR_CLIENT_SECRET: process.env.LINEAR_CLIENT_SECRET,
    JIRA_CLIENT_ID: process.env.JIRA_CLIENT_ID,
    JIRA_CLIENT_SECRET: process.env.JIRA_CLIENT_SECRET,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
