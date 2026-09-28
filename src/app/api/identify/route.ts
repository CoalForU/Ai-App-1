import { NextResponse } from "next/server";
import { getStubScanResult } from "@/lib/stub-data";

export async function POST() {
  // Simulate vision model latency so the results loading state feels real.
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return NextResponse.json(getStubScanResult());
}
