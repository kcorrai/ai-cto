import { Resend } from "resend";
import { env } from "@/env";
import type { ReactElement } from "react";

const FROM_ADDRESS = "AI CTO <noreply@aicto.app>";

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

export type SendEmailParams = {
  to: string;
  subject: string;
  react: ReactElement;
};

export async function sendEmail({ to, subject, react }: SendEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // Email not configured — log in dev, silent in prod
    if (process.env.NODE_ENV === "development") {
      console.log(`[email] Would send to ${to}: ${subject}`);
    }
    return;
  }

  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, react });
  if (error) {
    console.error(`[email] Failed to send to ${to}:`, error);
  }
}
