import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAuction, getLiveAuctions } from "@/lib/auctions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auctions = await getLiveAuctions({
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    brand: searchParams.get("brand") || undefined,
    size: searchParams.get("size") || undefined,
    sort:
      (searchParams.get("sort") as "ending" | "hot" | "newest" | "price" | null) ||
      "ending",
  });
  return NextResponse.json({ auctions });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    category?: string;
    condition?: string;
    photoDataUrl?: string;
    brand?: string;
    size?: string;
    barcode?: string | null;
    startingBid?: number;
    reservePrice?: number | null;
    durationHours?: number;
  };

  if (!body.title?.trim() || !body.photoDataUrl?.startsWith("data:image")) {
    return NextResponse.json(
      { error: "Title and photo are required." },
      { status: 400 },
    );
  }

  const startingBid = Number(body.startingBid);
  if (!Number.isFinite(startingBid) || startingBid < 1) {
    return NextResponse.json(
      { error: "Starting bid must be at least $1." },
      { status: 400 },
    );
  }

  const durationHours = Number(body.durationHours ?? 24);
  if (![1, 6, 12, 24, 48, 72].includes(durationHours)) {
    return NextResponse.json(
      { error: "Pick a valid auction length." },
      { status: 400 },
    );
  }

  const auction = await createAuction({
    sellerId: user.id,
    sellerName: user.name,
    title: body.title,
    description: body.description || "",
    category: body.category || "General",
    condition: body.condition || "Used",
    photoDataUrl: body.photoDataUrl,
    brand: body.brand,
    size: body.size,
    barcode: body.barcode,
    startingBid,
    reservePrice: body.reservePrice ? Number(body.reservePrice) : null,
    durationHours,
  });

  return NextResponse.json({ auction });
}
