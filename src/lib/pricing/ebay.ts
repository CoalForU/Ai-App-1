import type { SourcePrice } from "../types";
import { DEFAULT_ITEM } from "./shared";

export function stubEbayPrice(query = DEFAULT_ITEM.searchQuery): SourcePrice {
  const seed = hash(query);
  const median = 90 + (seed % 25);
  return {
    source: "ebay",
    label: "eBay",
    low: median - 16,
    high: median + 24,
    median,
    live: false,
  };
}

export async function fetchEbayBrowsePrice(
  query: string,
): Promise<SourcePrice | null> {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) return null;

  try {
    const basic = Buffer.from(`${appId}:${certId}`).toString("base64");
    const tokenRes = await fetch(
      "https://api.ebay.com/identity/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      },
    );
    if (!tokenRes.ok) return null;
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) return null;

    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "20");

    const searchRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });
    if (!searchRes.ok) return null;
    const data = (await searchRes.json()) as {
      itemSummaries?: Array<{ price?: { value?: string } }>;
    };
    const prices =
      data.itemSummaries
        ?.map((item) => Number(item.price?.value))
        .filter((n) => Number.isFinite(n) && n > 0) ?? [];
    if (prices.length < 3) return null;

    prices.sort((a, b) => a - b);
    const low = Math.round(prices[0]);
    const high = Math.round(prices[prices.length - 1]);
    const median = Math.round(prices[Math.floor(prices.length / 2)]);
    return {
      source: "ebay",
      label: "eBay",
      low,
      high,
      median,
      live: true,
    };
  } catch {
    return null;
  }
}

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}
