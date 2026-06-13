-- AlterEnum
ALTER TYPE "AnalysisTrigger" ADD VALUE 'monitoring';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "monitoringEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monitoringLastRun" TIMESTAMPTZ(6);
