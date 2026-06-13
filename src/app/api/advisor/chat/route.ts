import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { Ratelimit } from "@upstash/ratelimit";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { AI_MODEL } from "@/lib/ai/gateway";
import { createAdvisorSystemPrompt } from "@/lib/ai/prompts/advisor";

const rateLimitFree = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:advisor:free",
});
const rateLimitPro = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:advisor:pro",
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, plan: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const limiter = user.plan === "free" ? rateLimitFree : rateLimitPro;
  const { success } = await limiter.limit(user.id);
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const body = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    projectId: string;
    conversationId?: string;
  };
  const { messages, projectId, conversationId } = body;

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id, status: { not: "deleted" } },
    select: { id: true, name: true, githubOwner: true, githubRepo: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  // Fetch latest analysis for context
  const analysis = await db.analysis.findFirst({
    where: { projectId: project.id, status: "complete" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
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

  const projectName = `${project.githubOwner}/${project.githubRepo}`;
  const breakdown = (analysis?.scoreBreakdown as Record<string, unknown>) ?? {};

  const systemPrompt = createAdvisorSystemPrompt({
    projectName,
    score: analysis?.score ?? 0,
    label: (breakdown.label as string | undefined) ?? "Unknown",
    moduleScores: (analysis?.modules ?? []).map((m) => ({
      module: m.module as string,
      score: m.score ?? 0,
    })),
    topFindings: (analysis?.findingRecords ?? []).map((f) => ({
      severity: f.severity as string,
      title: f.title,
      module: f.module,
    })),
    summary: analysis?.summary ?? null,
  });

  const result = streamText({
    model: AI_MODEL,
    system: systemPrompt,
    messages,
    onFinish: async ({ text, usage }) => {
      // Persist messages to DB
      try {
        let convId = conversationId;

        if (!convId) {
          // Create conversation with title from first user message
          const firstUserMsg = messages.find((m) => m.role === "user");
          const title = firstUserMsg
            ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
            : "New conversation";

          const conv = await db.advisorConversation.create({
            data: { projectId: project.id, userId: user.id, title },
          });
          convId = conv.id;
        }

        const lastUserMsg = messages[messages.length - 1];
        if (lastUserMsg?.role === "user") {
          await db.advisorMessage.create({
            data: {
              conversationId: convId,
              role: "user",
              content: lastUserMsg.content,
            },
          });
        }

        await db.advisorMessage.create({
          data: {
            conversationId: convId,
            role: "assistant",
            content: text,
            tokenCount: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
          },
        });

        await db.advisorConversation.update({
          where: { id: convId },
          data: { messageCount: { increment: 2 }, updatedAt: new Date() },
        });
      } catch {
        // Non-fatal — streaming already succeeded
      }
    },
  });

  return result.toTextStreamResponse();
}
