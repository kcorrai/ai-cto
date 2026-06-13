-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

-- CreateTable
CREATE TABLE "scheduled_analyses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMPTZ(6) NOT NULL,
    "lastRunAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scheduled_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_analyses_nextRunAt_idx" ON "scheduled_analyses"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_analyses_projectId_key" ON "scheduled_analyses"("projectId");

-- AddForeignKey
ALTER TABLE "scheduled_analyses" ADD CONSTRAINT "scheduled_analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
