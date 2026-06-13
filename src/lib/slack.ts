import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";

type SlackBlock = Record<string, unknown>;

export async function sendSlackMessage(params: {
  orgId: string;
  blocks: SlackBlock[];
  fallbackText: string;
}) {
  const org = await db.organization.findUnique({
    where: { id: params.orgId },
    select: { slackBotToken: true, slackChannelId: true },
  });

  if (!org?.slackBotToken || !org.slackChannelId) return;

  const token = decrypt(org.slackBotToken);
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: org.slackChannelId,
      text: params.fallbackText,
      blocks: params.blocks,
    }),
  });
}

export function analysisCompleteBlocks(params: {
  projectName: string;
  score: number;
  summary: string;
  url: string;
}): SlackBlock[] {
  const scoreEmoji = params.score >= 70 ? "🟢" : params.score >= 40 ? "🟡" : "🔴";
  return [
    {
      type: "header",
      text: { type: "plain_text", text: `${scoreEmoji} Analysis Complete: ${params.projectName}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Score:* ${params.score}/100\n${params.summary}` },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "View Report" },
        url: params.url,
        action_id: "view_report",
      },
    },
  ];
}

export function criticalFindingBlocks(params: {
  projectName: string;
  findingTitle: string;
  url: string;
}): SlackBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🚨 *Critical Finding in ${params.projectName}*\n${params.findingTitle}`,
      },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "View Finding" },
        url: params.url,
        action_id: "view_finding",
      },
    },
  ];
}

export async function storeSlackCredentials(params: {
  orgId: string;
  botToken: string;
  teamId: string;
  channelId: string;
  channelName: string;
}) {
  await db.organization.update({
    where: { id: params.orgId },
    data: {
      slackBotToken: encrypt(params.botToken),
      slackTeamId: params.teamId,
      slackChannelId: params.channelId,
      slackChannelName: params.channelName,
      slackConfig: {
        analysis_complete: true,
        critical_finding: true,
        weekly_digest: false,
        findings_resolved: false,
      },
    },
  });
}
