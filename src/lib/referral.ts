import { nanoid } from "nanoid";
import { db } from "@/lib/db";

const REFERRAL_CODE_LENGTH = 10;
const REFERRAL_CREDIT_CENTS = 1000; // $10

export function generateReferralCode(): string {
  return nanoid(REFERRAL_CODE_LENGTH);
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) return user.referralCode;

  const code = generateReferralCode();
  await db.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });
  return code;
}

export async function applyReferral(newUserId: string, referralCode: string): Promise<void> {
  const referrer = await db.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });

  if (!referrer || referrer.id === newUserId) return;

  await db.$transaction([
    db.user.update({
      where: { id: newUserId },
      data: { referredById: referrer.id },
    }),
    db.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: newUserId,
        status: "pending",
      },
    }),
  ]);
}

export async function creditReferrer(referredUserId: string): Promise<void> {
  const referral = await db.referral.findUnique({
    where: { referredUserId },
    select: { id: true, referrerId: true, status: true },
  });

  if (!referral || referral.status !== "pending") return;

  await db.$transaction([
    db.referral.update({
      where: { id: referral.id },
      data: {
        status: "credited",
        convertedAt: new Date(),
        creditedAt: new Date(),
        creditAmount: REFERRAL_CREDIT_CENTS,
      },
    }),
    db.user.update({
      where: { id: referral.referrerId },
      data: { referralCredits: { increment: REFERRAL_CREDIT_CENTS } },
    }),
  ]);
}

export async function getReferralStats(userId: string) {
  const [referrals, user] = await Promise.all([
    db.referral.findMany({
      where: { referrerId: userId },
      select: { status: true, createdAt: true, convertedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { referralCredits: true, referralCode: true },
    }),
  ]);

  return {
    referralCode: user?.referralCode ?? null,
    totalCredits: user?.referralCredits ?? 0,
    totalReferrals: referrals.length,
    conversions: referrals.filter((r) => r.status !== "pending").length,
  };
}
