import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return Response.json({ findings: [] });

  const findings = await db.finding.findMany({
    where: { assignedToId: dbUser.id, isResolved: false },
    select: {
      id: true,
      title: true,
      severity: true,
      module: true,
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return Response.json({ findings });
}
