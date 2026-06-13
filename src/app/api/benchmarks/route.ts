import { NextRequest, NextResponse } from "next/server";
import { getBenchmarkSnapshot } from "@/lib/benchmarks/aggregation";

// Public endpoint — returns aggregated benchmark data for a given framework group
export async function GET(req: NextRequest) {
  const framework = req.nextUrl.searchParams.get("framework") ?? undefined;

  const snapshot = await getBenchmarkSnapshot(framework);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
