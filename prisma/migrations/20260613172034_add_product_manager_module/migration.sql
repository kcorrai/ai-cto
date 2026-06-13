-- AlterEnum
ALTER TYPE "ModuleName" ADD VALUE 'product_manager';

-- DropForeignKey
ALTER TABLE "custom_modules" DROP CONSTRAINT "custom_modules_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "custom_modules" ADD CONSTRAINT "custom_modules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
