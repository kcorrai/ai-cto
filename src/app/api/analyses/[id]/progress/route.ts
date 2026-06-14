import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const POLL_MS = 2000;
const MAX_POLLS = 150; // 5 minutes

const TERMINAL = new Set(["complete", "failed"]);

function encode(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const analysis = await db.analysis.findFirst({
    where: { id },
    select: { id: true, project: { select: { userId: true } } },
  });
  if (!analysis) return new Response("Not found", { status: 404 });
  if (analysis.project.userId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < MAX_POLLS; i++) {
        if (req.signal.aborted) break;

        const row = await db.analysis.findUnique({
          where: { id },
          select: {
            status: true,
            progress: true,
            errorMessage: true,
            modules: {
              select: { module: true, status: true },
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!row) break;

        try {
          controller.enqueue(
            encode({
              status: row.status,
              progress: row.progress,
              modules: row.modules,
              errorMessage: row.errorMessage ?? null,
            })
          );
        } catch {
          break;
        }

        if (TERMINAL.has(row.status)) break;

        // Wait POLL_MS or until request aborts
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, POLL_MS);
          req.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              resolve();
            },
            {
              once: true,
            }
          );
        });
      }

      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
