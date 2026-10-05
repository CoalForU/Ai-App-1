import { NextResponse } from "next/server";
import { getListingDetail } from "@/lib/listings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const listing = await getListingDetail(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  return NextResponse.json({ listing });
}
