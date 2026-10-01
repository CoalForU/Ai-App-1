import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitRating } from "@/lib/marketplace";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await request.json()) as {
    orderId?: string;
    stars?: number;
    comment?: string;
  };
  if (!body.orderId || !body.stars) {
    return NextResponse.json(
      { error: "orderId and stars are required." },
      { status: 400 },
    );
  }
  try {
    const rating = await submitRating({
      orderId: body.orderId,
      fromUserId: user.id,
      stars: Number(body.stars),
      comment: body.comment || "",
    });
    return NextResponse.json({ rating });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rating failed." },
      { status: 400 },
    );
  }
}
