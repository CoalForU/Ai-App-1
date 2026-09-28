import type { SourcePrice } from "../types";
import { DEFAULT_ITEM } from "./shared";

/** Facebook Marketplace has no public commercial search API — stub only. */
export function stubMarketplacePrice(
  query = DEFAULT_ITEM.searchQuery,
): SourcePrice {
  const seed = hash(query);
  const median = 80 + (seed % 20);
  return {
    source: "marketplace",
    label: "Facebook Marketplace",
    low: median - 12,
    high: median + 14,
    median,
    live: false,
  };
}

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}
