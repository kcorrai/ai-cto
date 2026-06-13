import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({ where: { clerkId }, select: { email: true } });
  if (user?.email !== adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all module records with feedback-bearing findings
  const modules = await db.analysisModule.findMany({
    where: { status: "complete", rawOutput: { not: {} } },
    select: { module: true, rawOutput: true, score: true },
    take: 5000,
  });

  type RawOutput = { promptVariant?: string; score?: number };
  type VariantStats = { scores: number[]; count: number };

  const stats: Record<string, Record<string, VariantStats>> = {};
  for (const m of modules) {
    const raw = m.rawOutput as RawOutput;
    const variant = raw?.promptVariant ?? "v1";
    if (!stats[m.module]) stats[m.module] = {};
    if (!stats[m.module]![variant]) stats[m.module]![variant] = { scores: [], count: 0 };
    if (m.score !== null) {
      stats[m.module]![variant]!.scores.push(m.score);
    }
    stats[m.module]![variant]!.count++;
  }

  const result = Object.entries(stats).map(([module, variants]) => ({
    module,
    variants: Object.entries(variants).map(([variant, s]) => ({
      variant,
      count: s.count,
      avgScore:
        s.scores.length > 0
          ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
          : null,
    })),
  }));

  return NextResponse.json({ stats: result });
}
