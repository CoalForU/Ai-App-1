import { promises as fs } from "fs";
import path from "path";
import type { Auction, Bid, Listing, ScanMonth, UserRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SCANS_FILE = path.join(DATA_DIR, "scans.json");
const AUCTIONS_FILE = path.join(DATA_DIR, "auctions.json");
const BIDS_FILE = path.join(DATA_DIR, "bids.json");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, value: T) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

export async function listUsers() {
  return readJson<UserRecord[]>(USERS_FILE, []);
}

export async function saveUsers(users: UserRecord[]) {
  await writeJson(USERS_FILE, users);
}

export async function findUserByEmail(email: string) {
  const users = await listUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const users = await listUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function upsertUser(user: UserRecord) {
  const users = await listUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  await saveUsers(users);
  return user;
}

export async function listScanMonths() {
  return readJson<ScanMonth[]>(SCANS_FILE, []);
}

export async function getScanCount(userId: string, monthKey: string) {
  const rows = await listScanMonths();
  return rows.find((r) => r.userId === userId && r.monthKey === monthKey)?.count ?? 0;
}

export async function incrementScanCount(userId: string, monthKey: string) {
  const rows = await listScanMonths();
  const index = rows.findIndex((r) => r.userId === userId && r.monthKey === monthKey);
  if (index >= 0) {
    rows[index] = { ...rows[index], count: rows[index].count + 1 };
  } else {
    rows.push({ userId, monthKey, count: 1 });
  }
  await writeJson(SCANS_FILE, rows);
  const row = rows.find((r) => r.userId === userId && r.monthKey === monthKey)!;
  return row.count;
}

export function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function listAuctions() {
  return readJson<Auction[]>(AUCTIONS_FILE, []);
}

export async function saveAuctions(auctions: Auction[]) {
  await writeJson(AUCTIONS_FILE, auctions);
}

export async function findAuctionById(id: string) {
  const auctions = await listAuctions();
  return auctions.find((a) => a.id === id) ?? null;
}

export async function upsertAuction(auction: Auction) {
  const auctions = await listAuctions();
  const index = auctions.findIndex((a) => a.id === auction.id);
  if (index >= 0) auctions[index] = auction;
  else auctions.unshift(auction);
  await saveAuctions(auctions);
  return auction;
}

export async function listBids(auctionId?: string) {
  const bids = await readJson<Bid[]>(BIDS_FILE, []);
  if (!auctionId) return bids;
  return bids.filter((b) => b.auctionId === auctionId);
}

export async function appendBid(bid: Bid) {
  const bids = await readJson<Bid[]>(BIDS_FILE, []);
  bids.unshift(bid);
  await writeJson(BIDS_FILE, bids);
  return bid;
}

/** Mark past-end auctions as ended and assign winners. */
export async function syncAuctionStatuses() {
  const now = Date.now();
  const auctions = await listAuctions();
  let changed = false;
  const next = auctions.map((auction) => {
    if (auction.status === "live" && new Date(auction.endsAt).getTime() <= now) {
      changed = true;
      const metReserve =
        auction.reservePrice == null || auction.currentBid >= auction.reservePrice;
      return {
        ...auction,
        status: "ended" as const,
        winnerId: metReserve && auction.bidCount > 0 ? auction.currentBidderId : null,
        winnerName:
          metReserve && auction.bidCount > 0 ? auction.currentBidderName : null,
      };
    }
    return auction;
  });
  if (changed) await saveAuctions(next);
  return next;
}

export async function listListings() {
  return readJson<Listing[]>(LISTINGS_FILE, []);
}

export async function saveListings(listings: Listing[]) {
  await writeJson(LISTINGS_FILE, listings);
}

export async function findListingById(id: string) {
  const listings = await listListings();
  return listings.find((l) => l.id === id) ?? null;
}

export async function upsertListing(listing: Listing) {
  const listings = await listListings();
  const index = listings.findIndex((l) => l.id === listing.id);
  if (index >= 0) listings[index] = listing;
  else listings.unshift(listing);
  await saveListings(listings);
  return listing;
}

export async function countSellerAuctionsInMonth(
  sellerId: string,
  monthKey = currentMonthKey(),
) {
  const auctions = await listAuctions();
  return auctions.filter(
    (a) => a.sellerId === sellerId && a.createdAt.startsWith(monthKey),
  ).length;
}

export async function countSellerListingsInMonth(
  sellerId: string,
  monthKey = currentMonthKey(),
) {
  const listings = await listListings();
  return listings.filter(
    (l) => l.sellerId === sellerId && l.createdAt.startsWith(monthKey),
  ).length;
}
