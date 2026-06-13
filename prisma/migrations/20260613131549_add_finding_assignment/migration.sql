-- AlterTable
ALTER TABLE "findings" ADD COLUMN     "assignedToId" UUID;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
