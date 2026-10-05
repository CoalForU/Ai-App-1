import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createListing, getActiveListings } from "@/lib/listings";
import { assertCanSell, limitReachedMessage } from "@/lib/plan-usage";

export async function GET() {
  const listings = await getActiveListings();
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const gate = await assertCanSell("listings");
  if (!gate.ok) {
    if (gate.reason === "auth") {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: limitReachedMessage("listings", gate.usage.plan),
        usage: gate.usage,
      },
      { status: 402 },
    );
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    category?: string;
    condition?: string;
    photoDataUrl?: string;
    price?: number;
  };

  if (!body.title?.trim() || !body.photoDataUrl?.startsWith("data:image")) {
    return NextResponse.json(
      { error: "Title and photo are required." },
      { status: 400 },
    );
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 1) {
    return NextResponse.json(
      { error: "List price must be at least $1." },
      { status: 400 },
    );
  }

  const listing = await createListing({
    sellerId: user.id,
    sellerName: user.name,
    title: body.title,
    description: body.description || "",
    category: body.category || "General",
    condition: body.condition || "Used",
    photoDataUrl: body.photoDataUrl,
    price,
  });

  return NextResponse.json({ listing });
}
