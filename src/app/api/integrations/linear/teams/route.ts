import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { getLinearTeams, getLinearProjects } from "@/lib/linear";

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { settings: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const settings = (user.settings as Record<string, unknown>) ?? {};
  const encryptedToken = settings.linearAccessToken as string | undefined;
  if (!encryptedToken) return new Response("Linear not connected", { status: 403 });

  const token = decrypt(encryptedToken);
  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");

  if (teamId) {
    const projects = await getLinearProjects(token, teamId);
    return Response.json(projects);
  }

  const teams = await getLinearTeams(token);
  return Response.json(teams);
}
