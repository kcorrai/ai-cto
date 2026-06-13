-- CreateTable
CREATE TABLE "finding_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "findingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "editedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "finding_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finding_comments_findingId_createdAt_idx" ON "finding_comments"("findingId", "createdAt");

-- CreateIndex
CREATE INDEX "finding_comments_userId_idx" ON "finding_comments"("userId");

-- AddForeignKey
ALTER TABLE "finding_comments" ADD CONSTRAINT "finding_comments_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_comments" ADD CONSTRAINT "finding_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
