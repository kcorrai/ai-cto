import { db } from "@/lib/db";
import type { ActivityEventType } from "@prisma/client";

export async function logActivity(params: {
  organizationId: string;
  userId: string;
  eventType: ActivityEventType;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.activityEvent.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        eventType: params.eventType,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        targetName: params.targetName ?? null,
        metadata: (params.metadata ?? {}) as never,
      },
    });
  } catch {
    // Non-fatal — never let activity logging break the main flow
  }
}
