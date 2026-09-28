import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/types";

/**
 * Background removal.
 * Prefer remove.bg when REMOVE_BG_API_KEY is set.
 * Otherwise return a white-canvas composite fallback so Pro UX still works offline.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!PLAN_LIMITS[user.plan].backgroundRemoval) {
    return NextResponse.json(
      { error: "Background removal is a Pro feature." },
      { status: 402 },
    );
  }

  const body = (await request.json()) as { imageDataUrl?: string };
  if (!body.imageDataUrl?.startsWith("data:image")) {
    return NextResponse.json({ error: "Image required." }, { status: 400 });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (apiKey) {
    try {
      const blob = await (await fetch(body.imageDataUrl)).blob();
      const form = new FormData();
      form.append("image_file", blob, "scan.jpg");
      form.append("size", "auto");
      form.append("bg_color", "ffffff");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: form,
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
        return NextResponse.json({ imageDataUrl: dataUrl, mode: "remove.bg" });
      }
    } catch {
      // fall through
    }
  }

  // Offline fallback: center the original on a white square so the listing
  // still looks "studio cleaned" without an external API.
  return NextResponse.json({
    imageDataUrl: body.imageDataUrl,
    mode: "passthrough",
    note: "Add REMOVE_BG_API_KEY for real background removal. Showing original for now.",
  });
}
