import { NextResponse } from "next/server";
import { getAuctionDetail } from "@/lib/auctions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const detail = await getAuctionDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Auction not found." }, { status: 404 });
  }
  return NextResponse.json(detail);
}
