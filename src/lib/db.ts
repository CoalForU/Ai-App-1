import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  AppNotification,
  Auction,
  Bid,
  Dispute,
  Order,
  Rating,
  ScanHistoryItem,
  ScanMonth,
  UserRecord,
  WatchItem,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SCANS_FILE = path.join(DATA_DIR, "scans.json");
const AUCTIONS_FILE = path.join(DATA_DIR, "auctions.json");
const BIDS_FILE = path.join(DATA_DIR, "bids.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const WATCHLIST_FILE = path.join(DATA_DIR, "watchlist.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const SCAN_HISTORY_FILE = path.join(DATA_DIR, "scan-history.json");
const RATINGS_FILE = path.join(DATA_DIR, "ratings.json");
const DISPUTES_FILE = path.join(DATA_DIR, "disputes.json");

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

function upsertById<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex((r) => r.id === row.id);
  if (index >= 0) rows[index] = row;
  else rows.unshift(row);
  return rows;
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

export async function listOrders() {
  return readJson<Order[]>(ORDERS_FILE, []);
}

export async function findOrderById(id: string) {
  const orders = await listOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function findOrderByAuctionId(auctionId: string) {
  const orders = await listOrders();
  return orders.find((o) => o.auctionId === auctionId) ?? null;
}

export async function upsertOrder(order: Order) {
  const orders = upsertById(await listOrders(), order);
  await writeJson(ORDERS_FILE, orders);
  return order;
}

export async function listWatchlist(userId?: string) {
  const rows = await readJson<WatchItem[]>(WATCHLIST_FILE, []);
  if (!userId) return rows;
  return rows.filter((r) => r.userId === userId);
}

export async function upsertWatchItem(item: WatchItem) {
  const rows = await listWatchlist();
  const existing = rows.findIndex(
    (r) => r.userId === item.userId && r.auctionId === item.auctionId,
  );
  if (existing >= 0) rows[existing] = item;
  else rows.unshift(item);
  await writeJson(WATCHLIST_FILE, rows);
  return item;
}

export async function removeWatchItem(userId: string, auctionId: string) {
  const rows = await listWatchlist();
  await writeJson(
    WATCHLIST_FILE,
    rows.filter((r) => !(r.userId === userId && r.auctionId === auctionId)),
  );
}

export async function listNotifications(userId?: string) {
  const rows = await readJson<AppNotification[]>(NOTIFICATIONS_FILE, []);
  if (!userId) return rows;
  return rows.filter((r) => r.userId === userId);
}

export async function appendNotification(note: AppNotification) {
  const rows = await listNotifications();
  rows.unshift(note);
  await writeJson(NOTIFICATIONS_FILE, rows);
  return note;
}

export async function saveNotifications(rows: AppNotification[]) {
  await writeJson(NOTIFICATIONS_FILE, rows);
}

export async function listScanHistory(userId?: string) {
  const rows = await readJson<ScanHistoryItem[]>(SCAN_HISTORY_FILE, []);
  if (!userId) return rows;
  return rows.filter((r) => r.userId === userId);
}

export async function upsertScanHistory(item: ScanHistoryItem) {
  const rows = upsertById(await listScanHistory(), item);
  await writeJson(SCAN_HISTORY_FILE, rows);
  return item;
}

export async function listRatings(userId?: string) {
  const rows = await readJson<Rating[]>(RATINGS_FILE, []);
  if (!userId) return rows;
  return rows.filter((r) => r.toUserId === userId || r.fromUserId === userId);
}

export async function appendRating(rating: Rating) {
  const rows = await listRatings();
  rows.unshift(rating);
  await writeJson(RATINGS_FILE, rows);
  return rating;
}

export async function listDisputes() {
  return readJson<Dispute[]>(DISPUTES_FILE, []);
}

export async function upsertDispute(dispute: Dispute) {
  const rows = upsertById(await listDisputes(), dispute);
  await writeJson(DISPUTES_FILE, rows);
  return dispute;
}

export async function findDisputeById(id: string) {
  const rows = await listDisputes();
  return rows.find((d) => d.id === id) ?? null;
}

/** Mark past-end auctions as ended, assign winners, and create checkout orders. */
export async function syncAuctionStatuses() {
  const now = Date.now();
  const auctions = await listAuctions();
  let changed = false;
  const endedWithWinner: Auction[] = [];
  const next = auctions.map((auction) => {
    if (auction.status === "live" && new Date(auction.endsAt).getTime() <= now) {
      changed = true;
      const metReserve =
        auction.reservePrice == null || auction.currentBid >= auction.reservePrice;
      const ended: Auction = {
        ...auction,
        status: "ended",
        winnerId: metReserve && auction.bidCount > 0 ? auction.currentBidderId : null,
        winnerName:
          metReserve && auction.bidCount > 0 ? auction.currentBidderName : null,
      };
      if (ended.winnerId) endedWithWinner.push(ended);
      return ended;
    }
    return auction;
  });
  if (changed) await saveAuctions(next);

  // Create orders for newly ended winners AND any older sold lots missing orders.
  const soldMissingOrders = next.filter(
    (a) => a.status === "ended" && a.winnerId,
  );
  for (const auction of soldMissingOrders) {
    const existing = await findOrderByAuctionId(auction.id);
    if (!existing && auction.winnerId) {
      await upsertOrder({
        id: randomUUID(),
        auctionId: auction.id,
        sellerId: auction.sellerId,
        buyerId: auction.winnerId,
        title: auction.title,
        amount: auction.currentBid,
        status: "awaiting_payment",
        createdAt: new Date().toISOString(),
        paidAt: null,
        payoutAt: null,
      });
    }
  }

  return next;
}
