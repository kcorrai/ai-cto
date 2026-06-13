import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAppInstallUrl, isGitHubAppEnabled } from "@/lib/github/app";
import { env } from "@/env";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGitHubAppEnabled()) {
    // Fall back to OAuth if App not configured
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/api/auth/github/connect`);
  }

  const installUrl = getAppInstallUrl();
  return NextResponse.redirect(installUrl);
}
