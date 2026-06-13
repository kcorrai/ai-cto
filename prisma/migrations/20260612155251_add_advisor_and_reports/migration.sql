-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('pdf', 'markdown', 'json');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "analysisId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "generatedById" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "blobUrl" TEXT,
    "blobPath" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicToken" VARCHAR(64),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(255),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "advisor_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "advisor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_publicToken_key" ON "reports"("publicToken");

-- CreateIndex
CREATE INDEX "reports_analysisId_idx" ON "reports"("analysisId");

-- CreateIndex
CREATE INDEX "reports_projectId_idx" ON "reports"("projectId");

-- CreateIndex
CREATE INDEX "reports_generatedById_idx" ON "reports"("generatedById");

-- CreateIndex
CREATE INDEX "advisor_conversations_projectId_idx" ON "advisor_conversations"("projectId");

-- CreateIndex
CREATE INDEX "advisor_conversations_userId_idx" ON "advisor_conversations"("userId");

-- CreateIndex
CREATE INDEX "advisor_conversations_createdAt_idx" ON "advisor_conversations"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "advisor_messages_conversationId_idx" ON "advisor_messages"("conversationId");

-- CreateIndex
CREATE INDEX "advisor_messages_createdAt_idx" ON "advisor_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_conversations" ADD CONSTRAINT "advisor_conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_conversations" ADD CONSTRAINT "advisor_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_messages" ADD CONSTRAINT "advisor_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "advisor_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
