import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const VERSION = process.env.npm_package_version ?? "0.0.0";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      { status: "degraded", error: "db_unavailable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: VERSION,
  });
}
