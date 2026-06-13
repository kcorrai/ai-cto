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

  const storedState = await redis.get<string>(`bitbucket:oauth:state:${userId}`);
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
  }
  await redis.del(`bitbucket:oauth:state:${userId}`);

  // Bitbucket uses Basic Auth for token exchange
  const credentials = Buffer.from(
    `${env.BITBUCKET_CLIENT_ID}:${env.BITBUCKET_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch("https://bitbucket.org/site/oauth2/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/bitbucket/callback`,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=no_token`);
  }

  // Fetch Bitbucket user info
  const userRes = await fetch("https://api.bitbucket.org/2.0/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const bbUser = userRes.ok
    ? ((await userRes.json()) as { account_id?: string; nickname?: string })
    : {};

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
          bitbucketAccessToken: encrypt(tokenData.access_token),
          ...(tokenData.refresh_token
            ? { bitbucketRefreshToken: encrypt(tokenData.refresh_token) }
            : {}),
          bitbucketUsername: bbUser.nickname,
          bitbucketAccountId: bbUser.account_id,
        })
      ),
    },
  });

  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?connected=bitbucket`);
}
