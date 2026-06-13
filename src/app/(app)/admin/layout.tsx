import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return (
      <div className="flex items-center justify-center p-12 text-center">
        <p className="text-sm text-[#ef4444]">ADMIN_EMAIL env var not set.</p>
      </div>
    );
  }

  const user = await db.user.findUnique({ where: { clerkId }, select: { email: true } });
  if (user?.email !== adminEmail) {
    return (
      <div className="flex items-center justify-center p-12 text-center">
        <p className="text-sm text-[#606060]">403 — Not authorized.</p>
      </div>
    );
  }

  return <>{children}</>;
}
