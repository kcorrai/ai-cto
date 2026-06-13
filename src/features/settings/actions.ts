"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type NotificationSettings = {
  emailOnComplete: boolean;
  weeklyDigest: boolean;
  emailOnCritical?: boolean;
  emailOnAssigned?: boolean;
  emailOnMention?: boolean;
};

export async function updateNotificationSettings(
  settings: NotificationSettings
): Promise<{ ok: boolean }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { ok: false };

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, settings: true },
  });
  if (!user) return { ok: false };

  const current = (user.settings as Record<string, unknown>) ?? {};
  await db.user.update({
    where: { id: user.id },
    data: {
      settings: {
        ...current,
        emailOnComplete: settings.emailOnComplete,
        weeklyDigest: settings.weeklyDigest,
        emailOnCritical: settings.emailOnCritical ?? current.emailOnCritical ?? true,
        emailOnAssigned: settings.emailOnAssigned ?? current.emailOnAssigned ?? true,
        emailOnMention: settings.emailOnMention ?? current.emailOnMention ?? true,
      },
    },
  });

  return { ok: true };
}

export async function deleteAccount(
  confirmEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { ok: false, error: "unauthorized" };

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true },
  });
  if (!user) return { ok: false, error: "unauthorized" };

  if (confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: "email_mismatch" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
  });

  return { ok: true };
}
