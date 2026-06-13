-- CreateEnum
CREATE TYPE "LeaderboardSubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "isLeaderboard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "leaderboardCategory" VARCHAR(100);

-- CreateTable
CREATE TABLE "leaderboard_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "githubUrl" VARCHAR(500) NOT NULL,
    "submitterEmail" VARCHAR(255),
    "message" TEXT,
    "status" "LeaderboardSubmissionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_isLeaderboard_idx" ON "projects"("isLeaderboard");

-- CreateIndex
CREATE INDEX "leaderboard_submissions_status_idx" ON "leaderboard_submissions"("status");
