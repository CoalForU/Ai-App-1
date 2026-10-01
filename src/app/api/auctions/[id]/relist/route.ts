import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { relistAuction } from "@/lib/auctions";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    durationHours?: number;
    startingBid?: number;
  };
  try {
    const auction = await relistAuction({
      auctionId: id,
      sellerId: user.id,
      durationHours: body.durationHours,
      startingBid: body.startingBid,
    });
    return NextResponse.json({ auction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Relist failed." },
      { status: 400 },
    );
  }
}
