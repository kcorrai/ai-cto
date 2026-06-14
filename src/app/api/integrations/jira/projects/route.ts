import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getJiraProjects, getJiraAccessToken } from "@/lib/jira";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const settings = (user.settings as Record<string, unknown>) ?? {};

  try {
    const { accessToken, cloudId } = await getJiraAccessToken(user.id, settings);
    const projects = await getJiraProjects(accessToken, cloudId);
    return Response.json(projects);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 400 });
  }
}
