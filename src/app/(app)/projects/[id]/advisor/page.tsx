import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdvisorChat } from "@/features/advisor/components/AdvisorChat";
import { deleteConversation } from "@/features/advisor/actions/conversations";
import { generateSuggestedPrompts } from "@/lib/ai/prompts/advisor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Advisor — AI CTO" };

export default async function AdvisorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id, userId: user.id, status: { not: "deleted" } },
    select: { id: true, githubOwner: true, githubRepo: true },
  });
  if (!project) notFound();

  const isPro = user.plan !== "free";

  // Fetch latest complete analysis for context and suggested prompts
  const analysis = await db.analysis.findFirst({
    where: { projectId: project.id, status: "complete" },
    orderBy: { createdAt: "desc" },
    select: {
      score: true,
      scoreBreakdown: true,
      summary: true,
      modules: {
        where: { status: "complete" },
        select: { module: true, score: true },
      },
      findingRecords: {
        where: { severity: { in: ["critical", "high"] } },
        take: 5,
        orderBy: { severity: "asc" },
        select: { severity: true, title: true, module: true },
      },
    },
  });

  const breakdown = (analysis?.scoreBreakdown as Record<string, unknown>) ?? {};

  const suggestedPrompts = analysis
    ? generateSuggestedPrompts({
        projectName: `${project.githubOwner}/${project.githubRepo}`,
        score: analysis.score ?? 0,
        label: (breakdown.label as string | undefined) ?? "Unknown",
        moduleScores: (analysis.modules ?? []).map((m) => ({
          module: m.module as string,
          score: m.score ?? 0,
        })),
        topFindings: (analysis.findingRecords ?? []).map((f) => ({
          severity: f.severity as string,
          title: f.title,
          module: f.module,
        })),
        summary: analysis.summary ?? null,
      })
    : [
        "What should I focus on before launch?",
        "What are the biggest technical risks in this project?",
        "Give me a prioritized list of improvements.",
      ];

  // Fetch conversation history (Pro only)
  const conversations = isPro
    ? await db.advisorConversation.findMany({
        where: { projectId: project.id, userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, title: true, messageCount: true, updatedAt: true },
      })
    : [];

  const projectId = project.id;
  async function handleDelete(convId: string) {
    "use server";
    await deleteConversation(convId, projectId);
  }

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      <AdvisorChat
        projectId={projectId}
        isPro={isPro}
        suggestedPrompts={suggestedPrompts}
        conversations={conversations}
        onDeleteConversation={handleDelete}
      />
    </div>
  );
}
