import { randomUUID } from "crypto";
import {
  appendBid,
  findAuctionById,
  listAuctions,
  listBids,
  listWatchlist,
  syncAuctionStatuses,
  upsertAuction,
} from "./db";
import { notifyUser } from "./marketplace";
import { minNextBid, type Auction, type Bid } from "./types";

export async function createAuction(input: {
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  photoDataUrl: string;
  brand?: string;
  size?: string;
  barcode?: string | null;
  startingBid: number;
  reservePrice?: number | null;
  durationHours: number;
}) {
  const now = new Date();
  const ends = new Date(now.getTime() + input.durationHours * 60 * 60 * 1000);
  const auction: Auction = {
    id: randomUUID(),
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    condition: input.condition.trim(),
    photoDataUrl: input.photoDataUrl,
    brand: input.brand?.trim() || undefined,
    size: input.size?.trim() || undefined,
    barcode: input.barcode?.trim() || null,
    startingBid: input.startingBid,
    reservePrice: input.reservePrice ?? null,
    currentBid: 0,
    currentBidderId: null,
    currentBidderName: null,
    bidCount: 0,
    status: "live",
    endsAt: ends.toISOString(),
    createdAt: now.toISOString(),
    winnerId: null,
    winnerName: null,
  };
  await upsertAuction(auction);
  return auction;
}

export async function relistAuction(input: {
  auctionId: string;
  sellerId: string;
  durationHours?: number;
  startingBid?: number;
}) {
  const source = await findAuctionById(input.auctionId);
  if (!source) throw new Error("Auction not found.");
  if (source.sellerId !== input.sellerId) {
    throw new Error("Only the seller can relist this item.");
  }
  if (source.status !== "ended" || source.winnerId) {
    throw new Error("Only unsold ended auctions can be relisted.");
  }
  return createAuction({
    sellerId: source.sellerId,
    sellerName: source.sellerName,
    title: source.title,
    description: source.description,
    category: source.category,
    condition: source.condition,
    photoDataUrl: source.photoDataUrl,
    brand: source.brand,
    size: source.size,
    barcode: source.barcode,
    startingBid: input.startingBid ?? source.startingBid,
    reservePrice: source.reservePrice,
    durationHours: input.durationHours ?? 24,
  });
}

export async function getLiveAuctions(filters?: {
  q?: string;
  category?: string;
  brand?: string;
  size?: string;
  sort?: "ending" | "hot" | "newest" | "price";
}) {
  let auctions = await syncAuctionStatuses();
  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    auctions = auctions.filter((a) =>
      [a.title, a.description, a.category, a.brand, a.size, a.condition]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (filters?.category) {
    const c = filters.category.toLowerCase();
    auctions = auctions.filter((a) => a.category.toLowerCase().includes(c));
  }
  if (filters?.brand) {
    const b = filters.brand.toLowerCase();
    auctions = auctions.filter((a) => (a.brand || "").toLowerCase().includes(b));
  }
  if (filters?.size) {
    const s = filters.size.toLowerCase();
    auctions = auctions.filter((a) => (a.size || a.condition || "").toLowerCase().includes(s));
  }

  const sort = filters?.sort || "ending";
  if (sort === "hot") {
    auctions.sort((a, b) => b.bidCount - a.bidCount || b.currentBid - a.currentBid);
  } else if (sort === "newest") {
    auctions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (sort === "price") {
    auctions.sort(
      (a, b) =>
        (b.currentBid || b.startingBid) - (a.currentBid || a.startingBid),
    );
  } else {
    auctions.sort(
      (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
    );
  }
  return auctions;
}

export async function getAuctionDetail(id: string) {
  await syncAuctionStatuses();
  const auction = await findAuctionById(id);
  if (!auction) return null;
  const bids = await listBids(id);
  return { auction, bids };
}

export async function placeBid(input: {
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
}) {
  await syncAuctionStatuses();
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw new Error("Auction not found.");
  if (auction.status !== "live") throw new Error("This auction has ended.");
  if (auction.sellerId === input.bidderId) {
    throw new Error("You can't bid on your own auction.");
  }

  const minimum = minNextBid(auction.currentBid, auction.startingBid);
  if (input.amount < minimum) {
    throw new Error(`Bid must be at least $${minimum}.`);
  }

  const previousBidderId = auction.currentBidderId;

  const bid: Bid = {
    id: randomUUID(),
    auctionId: auction.id,
    bidderId: input.bidderId,
    bidderName: input.bidderName,
    amount: input.amount,
    createdAt: new Date().toISOString(),
  };

  auction.currentBid = input.amount;
  auction.currentBidderId = input.bidderId;
  auction.currentBidderName = input.bidderName;
  auction.bidCount += 1;

  const endsAt = new Date(auction.endsAt).getTime();
  if (endsAt - Date.now() < 2 * 60 * 1000) {
    auction.endsAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  }

  await appendBid(bid);
  await upsertAuction(auction);

  if (previousBidderId && previousBidderId !== input.bidderId) {
    await notifyUser({
      userId: previousBidderId,
      kind: "outbid",
      title: "You've been outbid",
      body: `${auction.title} is now at $${input.amount}.`,
      href: `/auctions/${auction.id}`,
    });
  }

  await notifyUser({
    userId: auction.sellerId,
    kind: "system",
    title: "New bid",
    body: `${input.bidderName} bid $${input.amount} on ${auction.title}.`,
    href: `/auctions/${auction.id}`,
  });

  // Auto-watch for the bidder
  const watching = await listWatchlist(input.bidderId);
  if (!watching.some((w) => w.auctionId === auction.id)) {
    const { upsertWatchItem } = await import("./db");
    await upsertWatchItem({
      id: randomUUID(),
      userId: input.bidderId,
      auctionId: auction.id,
      createdAt: new Date().toISOString(),
    });
  }

  return { auction, bid };
}

export async function listSellerAuctions(sellerId: string) {
  const auctions = await listAuctions();
  return auctions.filter((a) => a.sellerId === sellerId);
}
