-- DropForeignKey
ALTER TABLE "advisor_conversations" DROP CONSTRAINT "advisor_conversations_projectId_fkey";

-- AlterTable
ALTER TABLE "advisor_conversations" ALTER COLUMN "projectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "advisor_conversations" ADD CONSTRAINT "advisor_conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
