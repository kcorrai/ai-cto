import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { env } from "@/env";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/sign-in`);

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`);
  }

  const stored = await redis.get<string>(`gitlab:oauth:state:${userId}`);
  if (!stored) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=expired_state`);
  }
  const { state: storedState, host } = JSON.parse(stored) as {
    state: string;
    host: string;
  };
  if (storedState !== state) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
  }
  await redis.del(`gitlab:oauth:state:${userId}`);

  const tokenRes = await fetch(`${host}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITLAB_CLIENT_ID,
      client_secret: env.GITLAB_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/gitlab/callback`,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=no_token`);
  }

  // Fetch GitLab user info
  const userRes = await fetch(`${host}/api/v4/user`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const gitlabUser = userRes.ok
    ? ((await userRes.json()) as { username?: string })
    : { username: undefined };

  // Store encrypted token in user settings
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, settings: true },
  });
  if (!user)
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=user_not_found`);

  const settings = (user.settings ?? {}) as Record<string, unknown>;
  await db.user.update({
    where: { clerkId: userId },
    data: {
      settings: JSON.parse(
        JSON.stringify({
          ...settings,
          gitlabAccessToken: encrypt(tokenData.access_token),
          gitlabUsername: gitlabUser.username,
          gitlabHost: host !== "https://gitlab.com" ? host : undefined,
        })
      ),
    },
  });

  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?connected=gitlab`);
}
