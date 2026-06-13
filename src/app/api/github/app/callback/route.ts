import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/env";

// GitHub redirects here after the user installs (or updates) the GitHub App:
// /api/github/app/callback?installation_id=...&setup_action=install
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/sign-in`);
  }

  const { searchParams } = req.nextUrl;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action"); // "install" | "update" | "delete"

  if (!installationId || isNaN(Number(installationId))) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/settings?error=missing_installation_id`
    );
  }

  if (setupAction === "delete") {
    // User uninstalled the app — remove the installation ID
    await db.user.update({
      where: { clerkId: userId },
      data: { githubInstallationId: null },
    });
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?disconnected=true`);
  }

  await db.user.update({
    where: { clerkId: userId },
    data: { githubInstallationId: BigInt(installationId) },
  });

  return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/settings?connected=true`);
}
