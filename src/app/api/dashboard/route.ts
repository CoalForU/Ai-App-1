import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSellerDashboard } from "@/lib/marketplace";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const data = await getSellerDashboard(user.id);
  return NextResponse.json(data);
}
