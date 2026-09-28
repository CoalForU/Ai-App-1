import Stripe from "stripe";
import type { PlanId } from "./types";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function stripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.STRIPE_PRICE_ULTIMATE,
  );
}

export function priceIdForPlan(plan: Exclude<PlanId, "basic">) {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO || null;
  return process.env.STRIPE_PRICE_ULTIMATE || null;
}

export function planFromStripePrice(priceId: string): PlanId {
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ULTIMATE) return "ultimate";
  return "basic";
}
