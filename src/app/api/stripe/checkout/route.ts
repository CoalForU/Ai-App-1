import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findUserById, upsertUser } from "@/lib/db";
import {
  getStripe,
  priceIdForPlan,
  stripeConfigured,
} from "@/lib/stripe";
import type { PlanId } from "@/lib/types";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as { plan?: PlanId };
  if (body.plan !== "pro" && body.plan !== "ultimate" && body.plan !== "basic") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  // Demo upgrade path when Stripe isn't configured yet.
  if (!stripeConfigured() || body.plan === "basic") {
    const user = await findUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    user.plan = body.plan;
    await upsertUser(user);
    return NextResponse.json({
      mode: "demo",
      plan: user.plan,
      message:
        body.plan === "basic"
          ? "Switched to Basic."
          : "Demo upgrade applied (Stripe keys not configured).",
    });
  }

  const stripe = getStripe();
  const priceId = priceIdForPlan(body.plan);
  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured." },
      { status: 500 },
    );
  }

  const user = await findUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await upsertUser(user);
  }

  const origin = new URL(request.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/plans?checkout=cancel`,
    metadata: { userId: user.id, plan: body.plan },
  });

  return NextResponse.json({ mode: "stripe", url: checkout.url });
}
