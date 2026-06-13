import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { env } from "@/env";

const STATE_TTL = 600;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!env.BITBUCKET_CLIENT_ID) {
    return NextResponse.json({ error: "Bitbucket integration not configured" }, { status: 503 });
  }

  const state = randomBytes(32).toString("hex");
  await redis.set(`bitbucket:oauth:state:${userId}`, state, { ex: STATE_TTL });

  const params = new URLSearchParams({
    client_id: env.BITBUCKET_CLIENT_ID,
    response_type: "code",
    scope: "repository account",
    state,
  });

  return NextResponse.redirect(`https://bitbucket.org/site/oauth2/authorize?${params.toString()}`);
}
