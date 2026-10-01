import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markPayoutSent } from "@/lib/marketplace";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const order = await markPayoutSent(id, user.id);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payout failed." },
      { status: 400 },
    );
  }
}
