import { NextResponse } from "next/server";
import { identifyItemFromPhoto } from "@/lib/identify";
import { getMarketPricing } from "@/lib/pricing";
import { assertCanScan, recordScan } from "@/lib/scans";

export async function POST(request: Request) {
  const gate = await assertCanScan();
  if (!gate.ok) {
    const status = gate.reason === "auth" ? 401 : 402;
    return NextResponse.json(
      {
        error:
          gate.reason === "auth"
            ? "Sign in to scan items."
            : "Monthly scan limit reached. Upgrade your plan.",
        usage: gate.usage,
      },
      { status },
    );
  }

  let imageDataUrl: string | null = null;
  try {
    const body = (await request.json()) as { imageDataUrl?: string };
    imageDataUrl = body.imageDataUrl ?? null;
  } catch {
    imageDataUrl = null;
  }

  const item = await identifyItemFromPhoto(imageDataUrl);
  const result = await getMarketPricing(item);
  await recordScan(gate.usage.userId!);

  return NextResponse.json({
    result,
    usage: {
      ...gate.usage,
      used: gate.usage.used + 1,
      remaining:
        gate.usage.limit == null
          ? null
          : Math.max(0, gate.usage.limit - (gate.usage.used + 1)),
    },
  });
}
