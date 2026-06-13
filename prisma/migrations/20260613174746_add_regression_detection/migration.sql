-- AlterTable
ALTER TABLE "findings" ADD COLUMN     "isRegression" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regressionOf" UUID;
