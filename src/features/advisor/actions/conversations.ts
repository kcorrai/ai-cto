"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function deleteConversation(conversationId: string, projectId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) redirect("/sign-in");

  await db.advisorConversation.deleteMany({
    where: { id: conversationId, userId: user.id },
  });

  revalidatePath(`/projects/${projectId}/advisor`);
}
