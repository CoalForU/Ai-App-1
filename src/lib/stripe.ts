import Stripe from "stripe";
import type { BillingInterval, PlanId } from "./types";

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

export function priceIdForPlan(
  plan: Exclude<PlanId, "basic">,
  interval: BillingInterval = "monthly",
) {
  if (interval === "semiannual") {
    if (plan === "pro") return process.env.STRIPE_PRICE_PRO_6MO || null;
    return process.env.STRIPE_PRICE_ULTIMATE_6MO || null;
  }
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO || null;
  return process.env.STRIPE_PRICE_ULTIMATE || null;
}

export function planFromStripePrice(priceId: string): PlanId {
  if (
    priceId === process.env.STRIPE_PRICE_PRO ||
    priceId === process.env.STRIPE_PRICE_PRO_6MO
  ) {
    return "pro";
  }
  if (
    priceId === process.env.STRIPE_PRICE_ULTIMATE ||
    priceId === process.env.STRIPE_PRICE_ULTIMATE_6MO
  ) {
    return "ultimate";
  }
  return "basic";
}
