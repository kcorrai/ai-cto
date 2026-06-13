import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PortfolioAdvisorChat } from "@/features/advisor/components/PortfolioAdvisorChat";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Portfolio Advisor — AI CTO" };

export default async function PortfolioAdvisorPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) redirect("/sign-in");

  const isPro = user.plan !== "free";

  // Fetch portfolio conversations (no projectId)
  const conversations = await db.advisorConversation.findMany({
    where: { userId: user.id, projectId: null },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, messageCount: true, updatedAt: true },
  });

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      <PortfolioAdvisorChat isPro={isPro} conversations={conversations} />
    </div>
  );
}
