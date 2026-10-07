import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { pushAuctionFrame, stopAuctionBroadcast } from "@/lib/auctions";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    frameDataUrl?: string;
    stop?: boolean;
  };

  try {
    if (body.stop) {
      const auction = await stopAuctionBroadcast({
        auctionId: id,
        sellerId: user.id,
      });
      return NextResponse.json({ auction });
    }

    if (!body.frameDataUrl?.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Camera frame required." },
        { status: 400 },
      );
    }

    const auction = await pushAuctionFrame({
      auctionId: id,
      sellerId: user.id,
      frameDataUrl: body.frameDataUrl,
    });
    return NextResponse.json({ auction });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update live frame.",
      },
      { status: 400 },
    );
  }
}
