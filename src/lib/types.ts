export type PlanId = "basic" | "pro" | "ultimate";

export type DemandLabel = "Hot" | "Steady" | "Slow";

export type PriceWindow = 30 | 60;

export type MarketplaceSource = "ebay" | "marketplace" | "stockx";

export interface SourcePrice {
  source: MarketplaceSource;
  label: string;
  low: number;
  high: number;
  median: number;
  live: boolean;
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

export interface SellThrough {
  daysToSell: number;
  demand: DemandLabel;
  options: SellOption[];
}

export interface IdentifiedItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  searchQuery: string;
}

export interface ScanResult extends IdentifiedItem {
  listAt: number;
  priceLow: number;
  priceHigh: number;
  sources: SourcePrice[];
  history30: HistoryPoint[];
  history60: HistoryPoint[];
  sellThrough30: SellThrough;
  sellThrough60: SellThrough;
  pricingMode: "live" | "stub";
}

export interface ListingDraft {
  title: string;
  description: string;
  category: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: PlanId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

export interface ScanMonth {
  userId: string;
  monthKey: string;
  count: number;
}

export const SCAN_STORAGE_KEY = "resellr-scan-photo";
export const SCAN_RESULT_KEY = "resellr-scan-result";
export const SCAN_CLEAN_PHOTO_KEY = "resellr-scan-clean-photo";

export const PLAN_LIMITS: Record<
  PlanId,
  {
    name: string;
    priceMonthly: number;
    scansPerMonth: number | null;
    backgroundRemoval: boolean;
    prioritySupport: boolean;
    customNotifications: boolean;
    priceAlerts: boolean;
    marketData: boolean;
  }
> = {
  basic: {
    name: "Basic",
    priceMonthly: 0,
    scansPerMonth: 7,
    backgroundRemoval: false,
    prioritySupport: false,
    customNotifications: false,
    priceAlerts: false,
    marketData: false,
  },
  pro: {
    name: "Pro",
    priceMonthly: 15,
    scansPerMonth: 25,
    backgroundRemoval: true,
    prioritySupport: true,
    customNotifications: true,
    priceAlerts: false,
    marketData: false,
  },
  ultimate: {
    name: "Ultimate",
    priceMonthly: 35,
    scansPerMonth: null,
    backgroundRemoval: true,
    prioritySupport: true,
    customNotifications: true,
    priceAlerts: true,
    marketData: true,
  },
};
