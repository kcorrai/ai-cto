import Stripe from "stripe";
import { env } from "@/env";

function createStripeClient(): Stripe {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

// Singleton — reused across invocations in Fluid Compute
const globalForStripe = globalThis as unknown as { stripe?: Stripe };
export const stripe = globalForStripe.stripe ?? createStripeClient();
if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;
