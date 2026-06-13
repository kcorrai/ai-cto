import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import type { WebhookEvent } from "@prisma/client";

type WebhookPayload = {
  event: string;
  timestamp: string;
  organizationId: string;
  data: Record<string, unknown>;
};

async function deliverWebhook(params: {
  webhookId: string;
  secret: string;
  url: string;
  payload: WebhookPayload;
}): Promise<{ status: number; durationMs: number; response: string }> {
  const body = JSON.stringify(params.payload);
  const sig = createHmac("sha256", params.secret).update(body).digest("hex");
  const start = Date.now();

  try {
    const res = await fetch(params.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AICto-Signature": `sha256=${sig}`,
        "X-AICto-Event": params.payload.event,
        "User-Agent": "AICto-Webhook/1.0",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const response = await res.text().catch(() => "");
    return { status: res.status, durationMs: Date.now() - start, response: response.slice(0, 500) };
  } catch {
    return { status: 0, durationMs: Date.now() - start, response: "Request failed or timed out" };
  }
}

export async function dispatchWebhookEvent(params: {
  organizationId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}): Promise<void> {
  const webhooks = await db.outboundWebhook.findMany({
    where: {
      organizationId: params.organizationId,
      enabled: true,
      events: { has: params.event },
    },
    select: { id: true, url: true, secret: true },
  });

  if (webhooks.length === 0) return;

  const payload: WebhookPayload = {
    event: params.event,
    timestamp: new Date().toISOString(),
    organizationId: params.organizationId,
    data: params.data,
  };

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const secret = decrypt(wh.secret);
      const { status, durationMs, response } = await deliverWebhook({
        webhookId: wh.id,
        secret,
        url: wh.url,
        payload,
      });
      await db.webhookDelivery.create({
        data: {
          webhookId: wh.id,
          event: params.event,
          payload: payload as never,
          status: status >= 200 && status < 300 ? "success" : "failed",
          statusCode: status || null,
          response,
          durationMs,
          deliveredAt: new Date(),
        },
      });
    })
  );
}
