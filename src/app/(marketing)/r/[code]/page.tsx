import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// Referral landing page: sets a 60-day cookie and redirects to sign-up
export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Validate the code exists
  const user = await db.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });

  if (user) {
    const cookieStore = await cookies();
    cookieStore.set("ref", code, {
      maxAge: 60 * 24 * 60 * 60, // 60 days
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  redirect("/sign-up");
}
