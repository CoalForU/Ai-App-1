import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateListing } from "@/lib/listing";
import type { ScanResult } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as { result?: ScanResult };
  if (!body.result) {
    return NextResponse.json({ error: "Missing scan result." }, { status: 400 });
  }

  const listing = await generateListing(body.result);
  return NextResponse.json({ listing });
}
