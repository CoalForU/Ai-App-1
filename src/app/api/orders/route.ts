import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getBuyerOrders, getSellerDashboard } from "@/lib/marketplace";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const role = new URL(request.url).searchParams.get("role") || "buyer";
  if (role === "seller") {
    const dash = await getSellerDashboard(user.id);
    return NextResponse.json({ orders: dash.orders });
  }
  const orders = await getBuyerOrders(user.id);
  return NextResponse.json({ orders });
}
