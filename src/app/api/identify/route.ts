import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { identifyItemFromPhoto } from "@/lib/identify";
import { getMarketPricing } from "@/lib/pricing";
import { assertCanScan, recordScan } from "@/lib/scans";
import { upsertScanHistory } from "@/lib/db";

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
  let barcode: string | null = null;
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      barcode?: string;
    };
    imageDataUrl = body.imageDataUrl ?? null;
    barcode = body.barcode?.trim() || null;
  } catch {
    imageDataUrl = null;
  }

  const item = await identifyItemFromPhoto(imageDataUrl);
  if (barcode) {
    item.barcode = barcode;
    item.searchQuery = `${item.searchQuery} ${barcode}`.trim();
  }
  const result = await getMarketPricing(item);
  if (barcode) result.barcode = barcode;
  await recordScan(gate.usage.userId!);

  await upsertScanHistory({
    id: randomUUID(),
    userId: gate.usage.userId!,
    result,
    photoDataUrl: imageDataUrl,
    barcode,
    feedback: null,
    createdAt: new Date().toISOString(),
  });

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
