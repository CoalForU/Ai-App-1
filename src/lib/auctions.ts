import { randomUUID } from "crypto";
import {
  appendBid,
  findAuctionById,
  listAuctions,
  listBids,
  syncAuctionStatuses,
  upsertAuction,
} from "./db";
import { minNextBid, type Auction, type Bid } from "./types";

/** Fill live-camera fields for auctions created before broadcasting existed. */
export function normalizeAuction(auction: Auction): Auction {
  return {
    ...auction,
    liveFrameDataUrl: auction.liveFrameDataUrl ?? null,
    lastFrameAt: auction.lastFrameAt ?? null,
    broadcasting: auction.broadcasting ?? false,
  };
}

export async function createAuction(input: {
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  photoDataUrl: string;
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
    liveFrameDataUrl: null,
    lastFrameAt: null,
    broadcasting: false,
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

/** Seller pushes a live camera frame while hosting. */
export async function pushAuctionFrame(input: {
  auctionId: string;
  sellerId: string;
  frameDataUrl: string;
}) {
  await syncAuctionStatuses();
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw new Error("Auction not found.");
  if (auction.sellerId !== input.sellerId) {
    throw new Error("Only the seller can broadcast this auction.");
  }
  if (auction.status !== "live") throw new Error("This auction has ended.");
  if (!input.frameDataUrl.startsWith("data:image")) {
    throw new Error("Invalid camera frame.");
  }

  auction.liveFrameDataUrl = input.frameDataUrl;
  auction.lastFrameAt = new Date().toISOString();
  auction.broadcasting = true;
  await upsertAuction(auction);
  return auction;
}

export async function stopAuctionBroadcast(input: {
  auctionId: string;
  sellerId: string;
}) {
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw new Error("Auction not found.");
  if (auction.sellerId !== input.sellerId) {
    throw new Error("Only the seller can stop the broadcast.");
  }
  auction.broadcasting = false;
  await upsertAuction(auction);
  return auction;
}

export async function getLiveAuctions() {
  const auctions = await syncAuctionStatuses();
  return auctions
    .map(normalizeAuction)
    .sort(
      (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
    );
}

export async function getAuctionDetail(id: string) {
  await syncAuctionStatuses();
  const auction = await findAuctionById(id);
  if (!auction) return null;
  const bids = await listBids(id);
  return { auction: normalizeAuction(auction), bids };
}

export async function placeBid(input: {
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
}) {
  await syncAuctionStatuses();
  const found = await findAuctionById(input.auctionId);
  if (!found) throw new Error("Auction not found.");
  const auction = normalizeAuction(found);
  if (auction.status !== "live") throw new Error("This auction has ended.");
  if (!auction.broadcasting) {
    throw new Error("Wait for the seller to go live on camera before bidding.");
  }
  if (auction.sellerId === input.bidderId) {
    throw new Error("You can't bid on your own auction.");
  }

  const minimum = minNextBid(auction.currentBid, auction.startingBid);
  if (input.amount < minimum) {
    throw new Error(`Bid must be at least $${minimum}.`);
  }

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

  // Soft close: if under 2 minutes left, extend by 2 minutes.
  const endsAt = new Date(auction.endsAt).getTime();
  if (endsAt - Date.now() < 2 * 60 * 1000) {
    auction.endsAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  }

  await appendBid(bid);
  await upsertAuction(auction);
  return { auction, bid };
}

export async function listSellerAuctions(sellerId: string) {
  const auctions = await listAuctions();
  return auctions.filter((a) => a.sellerId === sellerId);
}
