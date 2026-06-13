import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { env } from "@/env";

const STATE_TTL = 600;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!env.GITLAB_CLIENT_ID) {
    return NextResponse.json({ error: "GitLab integration not configured" }, { status: 503 });
  }

  // Support custom GitLab instance via ?host=
  const host = req.nextUrl.searchParams.get("host") ?? "https://gitlab.com";
  const state = randomBytes(32).toString("hex");
  await redis.set(`gitlab:oauth:state:${userId}`, JSON.stringify({ state, host }), {
    ex: STATE_TTL,
  });

  const params = new URLSearchParams({
    client_id: env.GITLAB_CLIENT_ID,
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/gitlab/callback`,
    response_type: "code",
    scope: "read_api read_user read_repository",
    state,
  });

  return NextResponse.redirect(`${host}/oauth/authorize?${params.toString()}`);
}
