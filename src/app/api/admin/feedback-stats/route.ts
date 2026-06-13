import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/env";

// Simple admin check: user's email must match ADMIN_EMAIL env var
async function isAdmin(clerkId: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL ?? env.NEXT_PUBLIC_APP_URL;
  if (!adminEmail) return false;
  const user = await db.user.findUnique({ where: { clerkId }, select: { email: true } });
  return user?.email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isAdmin(clerkId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Aggregate feedback by module
  const findings = await db.finding.findMany({
    where: {
      NOT: { metadata: { equals: {} } },
    },
    select: { module: true, metadata: true, title: true, severity: true },
    take: 1000,
  });

  type FeedbackMeta = { feedback?: { vote: string; note?: string; createdAt: string } };

  const stats: Record<
    string,
    { up: number; down: number; notes: { title: string; note: string; severity: string }[] }
  > = {};

  for (const f of findings) {
    const meta = f.metadata as FeedbackMeta;
    if (!meta?.feedback) continue;

    if (!stats[f.module]) stats[f.module] = { up: 0, down: 0, notes: [] };
    if (meta.feedback.vote === "up") {
      stats[f.module]!.up++;
    } else {
      stats[f.module]!.down++;
      if (meta.feedback.note) {
        stats[f.module]!.notes.push({
          title: f.title,
          note: meta.feedback.note,
          severity: f.severity,
        });
      }
    }
  }

  const moduleStats = Object.entries(stats).map(([module, s]) => ({
    module,
    up: s.up,
    down: s.down,
    total: s.up + s.down,
    approvalRate: s.up + s.down > 0 ? Math.round((s.up / (s.up + s.down)) * 100) : null,
    negativeNotes: s.notes,
  }));

  return NextResponse.json({ stats: moduleStats });
}
