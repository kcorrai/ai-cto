-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "slackBotToken" TEXT,
ADD COLUMN     "slackChannelId" VARCHAR(255),
ADD COLUMN     "slackChannelName" VARCHAR(255),
ADD COLUMN     "slackConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "slackTeamId" VARCHAR(255);
