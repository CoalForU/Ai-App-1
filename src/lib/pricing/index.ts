import { fetchEbayBrowsePrice, stubEbayPrice } from "./ebay";
import { stubMarketplacePrice } from "./marketplace";
import { fetchStockxPrice, stubStockxPrice } from "./stockx";
import { assembleScanResult, DEFAULT_ITEM } from "./shared";
import type { IdentifiedItem, ScanResult } from "../types";

export async function getMarketPricing(
  item: IdentifiedItem = DEFAULT_ITEM,
): Promise<ScanResult> {
  const [ebayLive, stockxLive] = await Promise.all([
    fetchEbayBrowsePrice(item.searchQuery),
    fetchStockxPrice(item.searchQuery),
  ]);

  const sources = [
    ebayLive ?? stubEbayPrice(item.searchQuery),
    stubMarketplacePrice(item.searchQuery),
    stockxLive ?? stubStockxPrice(item.searchQuery),
  ];

  const pricingMode = sources.some((s) => s.live) ? "live" : "stub";
  return assembleScanResult(item, sources, pricingMode);
}

export { DEFAULT_ITEM };
