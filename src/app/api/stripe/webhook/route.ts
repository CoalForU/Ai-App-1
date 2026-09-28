import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { findUserById, upsertUser } from "@/lib/db";
import { getStripe, planFromStripePrice } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planMeta = session.metadata?.plan;
    if (userId) {
      const user = await findUserById(userId);
      if (user) {
        if (planMeta === "pro" || planMeta === "ultimate") {
          user.plan = planMeta;
        }
        user.stripeCustomerId = String(session.customer || user.stripeCustomerId || "");
        user.stripeSubscriptionId = String(
          session.subscription || user.stripeSubscriptionId || "",
        );
        await upsertUser(user);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    const priceId = sub.items.data[0]?.price.id;
    if (userId && priceId) {
      const user = await findUserById(userId);
      if (user) {
        user.plan = planFromStripePrice(priceId);
        user.stripeSubscriptionId = sub.id;
        await upsertUser(user);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      const user = await findUserById(userId);
      if (user) {
        user.plan = "basic";
        user.stripeSubscriptionId = undefined;
        await upsertUser(user);
      }
    }
  }

  return NextResponse.json({ received: true });
}
