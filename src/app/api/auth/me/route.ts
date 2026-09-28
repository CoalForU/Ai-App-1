import { NextResponse } from "next/server";
import { getSessionUser, publicUser } from "@/lib/auth";
import { getScanUsage } from "@/lib/scans";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null, usage: null });
  const usage = await getScanUsage();
  return NextResponse.json({ user: publicUser(user), usage });
}
