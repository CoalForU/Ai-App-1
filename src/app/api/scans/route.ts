import { NextResponse } from "next/server";
import { getScanUsage } from "@/lib/scans";

export async function GET() {
  const usage = await getScanUsage();
  return NextResponse.json({ usage });
}
