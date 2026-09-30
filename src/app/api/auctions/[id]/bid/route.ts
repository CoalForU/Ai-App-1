import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { placeBid } from "@/lib/auctions";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { amount?: number };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid bid." }, { status: 400 });
  }

  try {
    const result = await placeBid({
      auctionId: id,
      bidderId: user.id,
      bidderName: user.name,
      amount,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bid failed." },
      { status: 400 },
    );
  }
}
