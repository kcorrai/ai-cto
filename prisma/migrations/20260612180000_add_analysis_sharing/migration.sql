-- AlterTable: add sharing fields to analyses
ALTER TABLE "analyses" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "analyses" ADD COLUMN "publicToken" VARCHAR(64);
ALTER TABLE "analyses" ADD COLUMN "shareFindings" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: unique constraint on publicToken
CREATE UNIQUE INDEX "analyses_publicToken_key" ON "analyses"("publicToken");
