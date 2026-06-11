import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { env } from "@/env";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/sign-in`);
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`);
  }

  // Verify CSRF state
  const storedState = await redis.get<string>(`github:oauth:state:${userId}`);
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
  }
  await redis.del(`github:oauth:state:${userId}`);

  // Exchange code for token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
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

  // Encrypt and store
  const encryptedToken = encrypt(tokenData.access_token);
  await db.user.update({
    where: { clerkId: userId },
    data: { githubAccessToken: encryptedToken },
  });

  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?connected=true`);
}
