import { NextResponse } from "next/server";
import { identifyItemFromQuery } from "@/lib/identify";
import { getMarketPricing } from "@/lib/pricing";
import { assertCanScan, recordScan } from "@/lib/scans";

/** Manual text lookup — thrift-store market check without a photo. */
export async function POST(request: Request) {
  const gate = await assertCanScan();
  if (!gate.ok) {
    const status = gate.reason === "auth" ? 401 : 402;
    return NextResponse.json(
      {
        error:
          gate.reason === "auth"
            ? "Sign in to look up items."
            : "Monthly scan limit reached. Upgrade your plan.",
        usage: gate.usage,
      },
      { status },
    );
  }

  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json(
      { error: "Enter at least 2 characters to look up." },
      { status: 400 },
    );
  }

  const item = identifyItemFromQuery(query);
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
