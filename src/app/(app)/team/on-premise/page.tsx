import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Server, Terminal, Database, Cloud, Shield, RefreshCw } from "lucide-react";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-3 text-[11px] text-[#a0a0a0] font-mono leading-relaxed">
      {children}
    </pre>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-[#1f1f1f] pb-2">
        <Icon className="h-4 w-4 text-[#3b82f6]" />
        <h2 className="text-sm font-medium text-[#f0f0f0]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default async function OnPremisePage() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const isAdmin = orgRole === "org:owner" || orgRole === "org:admin";
  if (!isAdmin) redirect("/team");

  const org = await db.organization.findUnique({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { plan: true },
  });
  if (!org) redirect("/team");

  if (org.plan !== "enterprise") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] mb-4">
          <Server className="h-6 w-6 text-[#404040]" />
        </div>
        <h2 className="text-base font-medium text-[#f0f0f0] mb-2">Enterprise Feature</h2>
        <p className="text-sm text-[#606060] max-w-xs">
          On-premise deployment documentation is available on the Enterprise plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-[#f0f0f0]">On-Premise Deployment</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Deploy AI CTO on your own infrastructure using Docker Compose or Kubernetes.
        </p>
      </div>

      <Section icon={Terminal} title="Quick Start (Docker Compose)">
        <p className="text-xs text-[#a0a0a0]">Prerequisites: Docker 24+ and Docker Compose v2.</p>
        <CodeBlock>{`# 1. Clone and configure
git clone https://github.com/your-org/ai-cto.git
cd ai-cto
cp .env.example .env.local   # fill in required values (see below)

# 2. Start the stack
docker compose up -d

# 3. Run migrations
docker compose exec app npx prisma migrate deploy

# 4. Open in browser
open http://localhost:3000`}</CodeBlock>
      </Section>

      <Section icon={Database} title="Environment Variables">
        <p className="text-xs text-[#a0a0a0]">
          Create a <code className="text-[#3b82f6]">.env</code> file (or set in your deployment
          environment):
        </p>
        <CodeBlock>{`# ── Required ──────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/aicto
DIRECT_URL=postgresql://user:password@localhost:5432/aicto   # same as DATABASE_URL for self-hosted

CLERK_SECRET_KEY=sk_live_...          # from clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

STRIPE_SECRET_KEY=sk_live_...         # from stripe.com (omit for no billing)
STRIPE_WEBHOOK_SECRET=whsec_...

ENCRYPTION_KEY=<64-hex-char-random>   # openssl rand -hex 32

NEXT_PUBLIC_APP_URL=https://ai-cto.yourdomain.com

# ── AI (choose one) ────────────────────────────────────────────────────────
AI_GATEWAY_API_KEY=...                # Vercel AI Gateway (cloud)
# OR for air-gapped (see below):
# AI_GATEWAY_BASE_URL=http://ollama:11434/v1
# AI_GATEWAY_API_KEY=ollama

# ── Storage ────────────────────────────────────────────────────────────────
BLOB_READ_WRITE_TOKEN=...             # Vercel Blob or S3-compatible

# ── Email ──────────────────────────────────────────────────────────────────
RESEND_API_KEY=re_...                 # from resend.com

# ── Redis (Upstash-compatible HTTP) ────────────────────────────────────────
UPSTASH_REDIS_REST_URL=http://redis:8079
UPSTASH_REDIS_REST_TOKEN=local-token

# ── GitHub App (optional) ──────────────────────────────────────────────────
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...            # base64-encoded PEM`}</CodeBlock>
      </Section>

      <Section icon={Cloud} title="External Services">
        <div className="space-y-2 text-xs text-[#a0a0a0]">
          <p className="font-medium text-[#d0d0d0]">Required external services:</p>
          <ul className="space-y-1.5 pl-4">
            <li>
              <span className="text-[#f0f0f0]">PostgreSQL 15+</span> — primary database (Neon, RDS,
              Cloud SQL, or self-hosted)
            </li>
            <li>
              <span className="text-[#f0f0f0]">Redis (Upstash-compatible)</span> — rate limiting and
              job queues. Use <code className="text-[#3b82f6]">serverless-redis-http</code> for
              self-hosted.
            </li>
            <li>
              <span className="text-[#f0f0f0]">Clerk</span> — authentication and SSO (cannot be
              self-hosted; contact Clerk for on-prem options)
            </li>
            <li>
              <span className="text-[#f0f0f0]">Blob storage</span> — file uploads. Use Vercel Blob,
              AWS S3, or MinIO (S3-compatible)
            </li>
            <li>
              <span className="text-[#f0f0f0]">AI provider</span> — Anthropic Claude via Vercel AI
              Gateway, or local LLM (see Air-Gapped below)
            </li>
          </ul>
        </div>
      </Section>

      <Section icon={Shield} title="Air-Gapped Deployment (Private LLM)">
        <p className="text-xs text-[#a0a0a0]">
          For environments with no internet access, use Ollama to run a local LLM:
        </p>
        <CodeBlock>{`# Start with air-gapped override (adds Ollama service)
docker compose -f docker-compose.yml -f docker-compose.airgapped.yml up -d

# Pull a model (first time only — requires internet or pre-cached image)
docker compose exec ollama ollama pull llama3.2:3b

# For better quality (larger model, needs 8GB+ RAM):
docker compose exec ollama ollama pull mixtral:8x7b

# Set the model via env var:
OLLAMA_MODEL=llama3.2:3b docker compose ... up -d`}</CodeBlock>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-400/80">
          <strong>Note:</strong> Local LLMs produce lower-quality analysis than Claude. Expect
          reduced finding quality and shorter summaries. Recommended minimum: 8B parameter model
          with 8GB+ RAM.
        </div>
      </Section>

      <Section icon={Server} title="Kubernetes (Helm Chart)">
        <p className="text-xs text-[#a0a0a0]">
          A Helm chart is available in the <code className="text-[#3b82f6]">deploy/helm/</code>{" "}
          directory:
        </p>
        <CodeBlock>{`# Add the chart repo
helm repo add ai-cto https://charts.yourdomain.com

# Install
helm install ai-cto ai-cto/ai-cto \\
  --namespace ai-cto \\
  --create-namespace \\
  --set app.image.tag=latest \\
  --set postgresql.enabled=true \\
  --set redis.enabled=true \\
  --set ingress.enabled=true \\
  --set ingress.host=ai-cto.yourdomain.com \\
  --set secrets.clerk.secretKey=sk_live_... \\
  --set secrets.encryption.key=$(openssl rand -hex 32)

# Upgrade
helm upgrade ai-cto ai-cto/ai-cto --namespace ai-cto --reuse-values`}</CodeBlock>
      </Section>

      <Section icon={RefreshCw} title="Update Process">
        <p className="text-xs text-[#a0a0a0]">Rolling updates with zero downtime:</p>
        <CodeBlock>{`# 1. Pull latest image
docker pull ghcr.io/your-org/ai-cto:latest

# 2. Run database migrations (before starting new version)
docker run --rm --env-file .env \\
  ghcr.io/your-org/ai-cto:latest \\
  npx prisma migrate deploy

# 3. Replace the running container (Docker Compose)
docker compose pull app
docker compose up -d --no-deps app

# Health check
curl -f http://localhost:3000/api/health || echo "App not healthy"`}</CodeBlock>
        <p className="text-xs text-[#606060]">
          Always run migrations before updating the app container. Migrations are
          backwards-compatible — the old version can run against the new schema.
        </p>
      </Section>

      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4 text-xs text-[#606060]">
        <p>
          Need help with on-premise deployment? Contact your enterprise support representative or
          email{" "}
          <a href="mailto:enterprise@aicto.dev" className="text-[#3b82f6] hover:underline">
            enterprise@aicto.dev
          </a>
          .
        </p>
      </div>
    </div>
  );
}
