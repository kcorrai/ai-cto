import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const moduleName = searchParams.get("module");
  if (!moduleName) return NextResponse.json({ error: "module param required" }, { status: 400 });

  // Fetch last 10 complete analyses with this module's score
  const analyses = await db.analysis.findMany({
    where: { projectId: project.id, status: "complete" },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      completedAt: true,
      modules: {
        where: { module: moduleName as never, status: "complete" },
        select: { score: true, rawOutput: true },
        take: 1,
      },
    },
  });

  const history = analyses
    .filter((a) => a.modules.length > 0 && a.modules[0]?.score != null)
    .map((a) => ({
      analysisId: a.id,
      completedAt: a.completedAt,
      score: a.modules[0]!.score!,
      rawOutput: a.modules[0]!.rawOutput,
    }))
    .reverse();

  return NextResponse.json({ history });
}
