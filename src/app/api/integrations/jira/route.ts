import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const settings = { ...(user.settings as object) } as Record<string, unknown>;
  delete settings.jiraAccessToken;
  delete settings.jiraRefreshToken;
  delete settings.jiraCloudId;
  delete settings.jiraCloudName;

  await db.user.update({
    where: { id: user.id },
    data: { settings: settings as Prisma.InputJsonValue },
  });

  return new Response(null, { status: 204 });
}
