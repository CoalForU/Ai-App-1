export type DemandLabel = "Hot" | "Steady" | "Slow";

export type PriceWindow = 30 | 60;

export type MarketplaceSource = "ebay" | "marketplace" | "stockx";

export interface SourcePrice {
  source: MarketplaceSource;
  label: string;
  low: number;
  high: number;
  median: number;
}

export interface HistoryPoint {
  day: number;
  price: number;
}

export interface SellOption {
  label: string;
  price: number;
  daysToSell: number;
}

export interface ScanResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  listAt: number;
  priceLow: number;
  priceHigh: number;
  sources: SourcePrice[];
  history30: HistoryPoint[];
  history60: HistoryPoint[];
  sellThrough30: {
    daysToSell: number;
    demand: DemandLabel;
    options: SellOption[];
  };
  sellThrough60: {
    daysToSell: number;
    demand: DemandLabel;
    options: SellOption[];
  };
}

export const SCAN_STORAGE_KEY = "flipscout-scan-photo";
