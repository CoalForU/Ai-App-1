import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listDisputes } from "@/lib/db";
import { createDispute } from "@/lib/marketplace";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const disputes = (await listDisputes()).filter(
    (d) => d.openerId === user.id || d.againstId === user.id,
  );
  return NextResponse.json({ disputes });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await request.json()) as { orderId?: string; reason?: string };
  if (!body.orderId || !body.reason?.trim()) {
    return NextResponse.json(
      { error: "orderId and reason are required." },
      { status: 400 },
    );
  }
  try {
    const dispute = await createDispute({
      orderId: body.orderId,
      openerId: user.id,
      reason: body.reason,
    });
    return NextResponse.json({ dispute });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dispute failed." },
      { status: 400 },
    );
  }
}
