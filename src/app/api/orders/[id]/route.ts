import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findOrderById, listRatings } from "@/lib/db";
import { syncAuctionStatuses } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  await syncAuctionStatuses();
  const { id } = await params;
  const order = await findOrderById(id);
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const ratings = (await listRatings()).filter((r) => r.orderId === order.id);
  return NextResponse.json({ order, ratings });
}
