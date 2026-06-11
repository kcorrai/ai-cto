import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { env } from "@/env";

const STATE_TTL = 600; // 10 minutes

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = randomBytes(32).toString("hex");
  await redis.set(`github:oauth:state:${userId}`, state, { ex: STATE_TTL });

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID!,
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: "public_repo read:user read:org",
    state,
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
