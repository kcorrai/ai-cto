import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/env";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const clientId = env.JIRA_CLIENT_ID;
  if (!clientId) return new Response("Jira integration not configured", { status: 503 });

  const state = randomBytes(16).toString("hex");
  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`;

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  await db.user.update({
    where: { id: user.id },
    data: {
      settings: {
        ...(user.settings as object),
        jiraOAuthState: state,
      } as Prisma.InputJsonValue,
    },
  });

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: clientId,
    scope: "read:jira-user read:jira-work write:jira-work offline_access",
    redirect_uri: callbackUrl,
    response_type: "code",
    prompt: "consent",
    state,
  });

  return redirect(`https://auth.atlassian.com/authorize?${params.toString()}`);
}
