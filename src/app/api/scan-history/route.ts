import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth";
import { listScanHistory, upsertScanHistory } from "@/lib/db";
import type { ScanResult } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const items = (await listScanHistory(user.id)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = (await request.json()) as {
    id?: string;
    result?: ScanResult;
    photoDataUrl?: string | null;
    barcode?: string | null;
    feedback?: "correct" | "wrong" | null;
  };

  if (body.id && body.feedback) {
    const items = await listScanHistory(user.id);
    const existing = items.find((i) => i.id === body.id);
    if (!existing) {
      return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    }
    const updated = await upsertScanHistory({
      ...existing,
      feedback: body.feedback,
    });
    return NextResponse.json({ item: updated });
  }

  if (!body.result) {
    return NextResponse.json({ error: "result required." }, { status: 400 });
  }

  const item = await upsertScanHistory({
    id: randomUUID(),
    userId: user.id,
    result: body.result,
    photoDataUrl: body.photoDataUrl ?? null,
    barcode: body.barcode ?? body.result.barcode ?? null,
    feedback: null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ item });
}
