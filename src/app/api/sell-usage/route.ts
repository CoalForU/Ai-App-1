import { NextResponse } from "next/server";
import { getSellUsage } from "@/lib/plan-usage";

export async function GET() {
  const [auctions, listings] = await Promise.all([
    getSellUsage("auctions"),
    getSellUsage("listings"),
  ]);
  return NextResponse.json({ auctions, listings });
}
