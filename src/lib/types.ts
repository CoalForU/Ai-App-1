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

export type AuctionStatus = "live" | "ended";

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface Auction {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  photoDataUrl: string;
  startingBid: number;
  reservePrice: number | null;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderName: string | null;
  bidCount: number;
  status: AuctionStatus;
  endsAt: string;
  createdAt: string;
  winnerId: string | null;
  winnerName: string | null;
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
    liveAuctions: boolean;
    prioritySupport: boolean;
    backgroundRemoval: boolean;
    customNotifications: boolean;
    priceAlerts: boolean;
    marketData: boolean;
  }
> = {
  basic: {
    name: "Basic",
    priceMonthly: 0,
    scansPerMonth: 7,
    liveAuctions: true,
    prioritySupport: false,
    backgroundRemoval: false,
    customNotifications: false,
    priceAlerts: false,
    marketData: false,
  },
  pro: {
    name: "Pro",
    priceMonthly: 15,
    scansPerMonth: 25,
    liveAuctions: true,
    prioritySupport: true,
    backgroundRemoval: false,
    customNotifications: false,
    priceAlerts: false,
    marketData: false,
  },
  ultimate: {
    name: "Ultimate",
    priceMonthly: 35,
    scansPerMonth: null,
    liveAuctions: true,
    prioritySupport: true,
    backgroundRemoval: true,
    customNotifications: true,
    priceAlerts: true,
    marketData: true,
  },
};

export type BillingInterval = "monthly" | "semiannual";

/** 6-month prepaid total with 5% savings vs paying month-to-month. */
export function priceForInterval(
  monthly: number,
  interval: BillingInterval,
): number {
  if (interval === "monthly") return monthly;
  return Math.round(monthly * 6 * 0.95 * 100) / 100;
}

export function formatUsd(amount: number) {
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export function minNextBid(currentBid: number, startingBid: number) {
  const base = Math.max(currentBid, startingBid);
  if (currentBid <= 0) return startingBid;
  const bump = Math.max(1, Math.round(base * 0.05));
  return base + bump;
}
