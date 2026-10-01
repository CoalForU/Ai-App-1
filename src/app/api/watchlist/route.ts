import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWatchlistAuctions, toggleWatch } from "@/lib/marketplace";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const items = await getWatchlistAuctions(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await request.json()) as { auctionId?: string };
  if (!body.auctionId) {
    return NextResponse.json({ error: "auctionId required." }, { status: 400 });
  }
  const result = await toggleWatch(user.id, body.auctionId);
  return NextResponse.json(result);
}
