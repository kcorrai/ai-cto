import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import type { WebhookEvent } from "@prisma/client";

type WebhookPayload = {
  event: string;
  timestamp: string;
  organizationId: string;
  data: Record<string, unknown>;
};

// Retry delay schedule (ms): attempt 2→1min, 3→5min, 4→30min, 5→2hr
const RETRY_DELAYS_MS = [0, 60_000, 300_000, 1_800_000, 7_200_000];
const MAX_ATTEMPTS = 5;

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

function nextRetryAt(attemptCount: number): Date | null {
  const delayMs = RETRY_DELAYS_MS[attemptCount]; // index = next attempt number
  if (!delayMs) return null;
  return new Date(Date.now() + delayMs);
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

      const success = status >= 200 && status < 300;
      await db.webhookDelivery.create({
        data: {
          webhookId: wh.id,
          event: params.event,
          payload: payload as never,
          status: success ? "success" : "failed",
          statusCode: status || null,
          response,
          durationMs,
          deliveredAt: new Date(),
          attempt: 1,
          nextRetryAt: success ? null : nextRetryAt(1),
        },
      });
    })
  );
}

export async function retryFailedWebhooks(): Promise<void> {
  const now = new Date();
  const due = await db.webhookDelivery.findMany({
    where: {
      status: "failed",
      nextRetryAt: { lte: now },
      attempt: { lt: MAX_ATTEMPTS },
    },
    select: {
      id: true,
      attempt: true,
      webhookId: true,
      event: true,
      payload: true,
      webhook: { select: { url: true, secret: true, enabled: true } },
    },
    take: 50,
  });

  for (const delivery of due) {
    if (!delivery.webhook.enabled) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "dead", nextRetryAt: null },
      });
      continue;
    }

    const newAttempt = delivery.attempt + 1;
    const secret = decrypt(delivery.webhook.secret);
    const payload = delivery.payload as WebhookPayload;

    const { status, durationMs, response } = await deliverWebhook({
      webhookId: delivery.webhookId,
      secret,
      url: delivery.webhook.url,
      payload,
    });

    const success = status >= 200 && status < 300;
    const dead = !success && newAttempt >= MAX_ATTEMPTS;

    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: success ? "success" : dead ? "dead" : "failed",
        statusCode: status || null,
        response,
        durationMs,
        attempt: newAttempt,
        deliveredAt: success ? new Date() : null,
        nextRetryAt: success || dead ? null : nextRetryAt(newAttempt),
      },
    });

    if (dead) {
      logger.warn("Webhook delivery dead after max attempts", {
        deliveryId: delivery.id,
        webhookId: delivery.webhookId,
      });
    }
  }
}
