import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { Ratelimit } from "@upstash/ratelimit";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { AI_MODEL } from "@/lib/ai/gateway";
import { createPortfolioAdvisorSystemPrompt } from "@/lib/ai/prompts/portfolio-advisor";

const rateLimitFree = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:portfolio-advisor:free",
});
const rateLimitPro = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:portfolio-advisor:pro",
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
  if (!success) return new Response("Rate limit exceeded", { status: 429 });

  const body = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    conversationId?: string;
  };
  const { messages, conversationId } = body;

  // Build portfolio context from all user projects
  const projects = await db.project.findMany({
    where: { userId: user.id, status: { not: "deleted" } },
    orderBy: { lastAnalyzedAt: { sort: "desc", nulls: "last" } },
    select: {
      githubOwner: true,
      githubRepo: true,
      lastAnalyzedAt: true,
      analyses: {
        where: { status: "complete" },
        orderBy: { createdAt: "desc" },
        take: 1,
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
            take: 3,
            orderBy: { severity: "asc" },
            select: { severity: true, title: true },
          },
        },
      },
    },
  });

  const projectSummaries = projects.map((p) => {
    const latest = p.analyses[0];
    const breakdown = (latest?.scoreBreakdown as Record<string, unknown>) ?? {};
    return {
      name: `${p.githubOwner}/${p.githubRepo}`,
      score: latest?.score ?? null,
      label: (breakdown.label as string | undefined) ?? "Unknown",
      lastAnalyzedAt: p.lastAnalyzedAt,
      moduleScores: (latest?.modules ?? []).map((m) => ({
        module: m.module as string,
        score: m.score ?? 0,
      })),
      topFindings: (latest?.findingRecords ?? []).map((f) => ({
        severity: f.severity as string,
        title: f.title,
      })),
      summary: latest?.summary ?? null,
    };
  });

  const systemPrompt = createPortfolioAdvisorSystemPrompt(projectSummaries);

  const result = streamText({
    model: AI_MODEL,
    system: systemPrompt,
    messages,
    onFinish: async ({ text, usage }) => {
      try {
        let convId = conversationId;

        if (!convId) {
          const firstUserMsg = messages.find((m) => m.role === "user");
          const title = firstUserMsg
            ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
            : "Portfolio conversation";

          const conv = await db.advisorConversation.create({
            data: { userId: user.id, title },
          });
          convId = conv.id;
        }

        const lastUserMsg = messages[messages.length - 1];
        if (lastUserMsg?.role === "user") {
          await db.advisorMessage.create({
            data: { conversationId: convId, role: "user", content: lastUserMsg.content },
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
        // Non-fatal
      }
    },
  });

  return result.toTextStreamResponse();
}
