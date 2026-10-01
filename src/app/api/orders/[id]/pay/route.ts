import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findOrderById } from "@/lib/db";
import { payOrderDemo } from "@/lib/marketplace";
import { getStripe } from "@/lib/stripe";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { mode?: string };

  // Optional real Stripe Checkout for one-time payment when secret key is set
  const stripe = getStripe();
  if (body.mode === "stripe" && stripe) {
    const order = await findOrderById(id);
    if (!order || order.buyerId !== user.id) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(order.amount * 100),
            product_data: { name: order.title },
          },
        },
      ],
      metadata: { orderId: order.id },
      success_url: `${origin}/orders/${order.id}?paid=1`,
      cancel_url: `${origin}/orders/${order.id}?cancel=1`,
    });
    return NextResponse.json({ mode: "stripe", url: session.url });
  }

  try {
    const order = await payOrderDemo(id, user.id);
    return NextResponse.json({ mode: "demo", order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed." },
      { status: 400 },
    );
  }
}
