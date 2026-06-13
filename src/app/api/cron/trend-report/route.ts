import { NextRequest, NextResponse } from "next/server";
import { generateTrendReport } from "@/lib/trend-reports/generator";

// Runs quarterly via Vercel cron — generates and returns the trend report.
// The response is cached at the CDN level for 30 days.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await generateTrendReport();

  return NextResponse.json(report, {
    headers: { "Cache-Control": "public, s-maxage=2592000" },
  });
}

// Public endpoint returns current benchmark data as a report (CDN-cached 24h)
export async function POST(_req: NextRequest) {
  const report = await generateTrendReport();
  return NextResponse.json(report, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
