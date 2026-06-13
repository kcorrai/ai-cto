import { Resend } from "resend";
import { env } from "@/env";
import { logger } from "@/lib/logger";
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
    if (process.env.NODE_ENV === "development") {
      logger.info("Email skipped (not configured)", { to, subject });
    }
    return;
  }

  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, react });
  if (error) {
    logger.error("Email send failed", { to, subject, error: error.message });
  }
}
