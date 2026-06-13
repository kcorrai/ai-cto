import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as { isPublic: boolean; shareFindings?: boolean };

  const analysis = await db.analysis.findFirst({
    where: { id, status: "complete", project: { userId: user.id } },
    select: { id: true, isPublic: true, publicToken: true },
  });
  if (!analysis) return new Response("Not found", { status: 404 });

  const token = analysis.publicToken ?? randomBytes(24).toString("hex");

  const updated = await db.analysis.update({
    where: { id: analysis.id },
    data: {
      isPublic: body.isPublic,
      publicToken: body.isPublic ? token : analysis.publicToken,
      shareFindings: body.shareFindings ?? true,
    },
    select: { isPublic: true, publicToken: true, shareFindings: true },
  });

  return Response.json(updated);
}
