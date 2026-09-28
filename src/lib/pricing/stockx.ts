import type { SourcePrice } from "../types";
import { DEFAULT_ITEM } from "./shared";

export function stubStockxPrice(query = DEFAULT_ITEM.searchQuery): SourcePrice {
  const seed = hash(query);
  const median = 105 + (seed % 30);
  return {
    source: "stockx",
    label: "StockX",
    low: median - 10,
    high: median + 18,
    median,
    live: false,
  };
}

export async function fetchStockxPrice(query: string): Promise<SourcePrice | null> {
  // Partner API is invite-only. Keep a live hook for future keys.
  if (!process.env.STOCKX_API_KEY) return null;
  void query;
  return null;
}

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}
