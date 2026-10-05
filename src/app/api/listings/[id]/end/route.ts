import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { endListing } from "@/lib/listings";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const listing = await endListing({
      listingId: id,
      sellerId: user.id,
    });
    return NextResponse.json({ listing });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not end listing." },
      { status: 400 },
    );
  }
}
