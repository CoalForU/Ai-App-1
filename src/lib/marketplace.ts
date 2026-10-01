import { randomUUID } from "crypto";
import {
  appendNotification,
  appendRating,
  findAuctionById,
  findOrderByAuctionId,
  findOrderById,
  findUserById,
  listNotifications,
  listOrders,
  listRatings,
  listWatchlist,
  removeWatchItem,
  saveNotifications,
  syncAuctionStatuses,
  upsertDispute,
  upsertOrder,
  upsertUser,
  upsertWatchItem,
} from "./db";
import type {
  AppNotification,
  Dispute,
  NotificationKind,
  Order,
  Rating,
  WatchItem,
} from "./types";

export async function notifyUser(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
}) {
  const note: AppNotification = {
    id: randomUUID(),
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await appendNotification(note);
  return note;
}

export async function getUserNotifications(userId: string) {
  const rows = await listNotifications(userId);
  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const all = await listNotifications();
  const next = all.map((n) => {
    if (n.userId !== userId) return n;
    if (!ids || ids.includes(n.id)) return { ...n, read: true };
    return n;
  });
  await saveNotifications(next);
  return next.filter((n) => n.userId === userId);
}

export async function toggleWatch(userId: string, auctionId: string) {
  const rows = await listWatchlist(userId);
  const existing = rows.find((r) => r.auctionId === auctionId);
  if (existing) {
    await removeWatchItem(userId, auctionId);
    return { watching: false as const };
  }
  const item: WatchItem = {
    id: randomUUID(),
    userId,
    auctionId,
    createdAt: new Date().toISOString(),
  };
  await upsertWatchItem(item);
  return { watching: true as const, item };
}

export async function getWatchlistAuctions(userId: string) {
  await syncAuctionStatuses();
  const watches = await listWatchlist(userId);
  const auctions = [];
  for (const watch of watches) {
    const auction = await findAuctionById(watch.auctionId);
    if (auction) auctions.push({ watch, auction });
  }
  return auctions;
}

/** Create ending-soon notifications for watchers (within 1 hour). */
export async function fanOutEndingSoon() {
  await syncAuctionStatuses();
  const watches = await listWatchlist();
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  for (const watch of watches) {
    const auction = await findAuctionById(watch.auctionId);
    if (!auction || auction.status !== "live") continue;
    const left = new Date(auction.endsAt).getTime() - now;
    if (left <= 0 || left > hour) continue;
    const existing = (await listNotifications(watch.userId)).find(
      (n) =>
        n.kind === "ending_soon" &&
        n.href === `/auctions/${auction.id}` &&
        Date.now() - new Date(n.createdAt).getTime() < hour,
    );
    if (existing) continue;
    await notifyUser({
      userId: watch.userId,
      kind: "ending_soon",
      title: "Ending soon",
      body: `${auction.title} ends in under an hour.`,
      href: `/auctions/${auction.id}`,
    });
  }
}

export async function getSellerDashboard(sellerId: string) {
  const auctions = await syncAuctionStatuses();
  const mine = auctions.filter((a) => a.sellerId === sellerId);
  const orders = (await listOrders()).filter((o) => o.sellerId === sellerId);
  const live = mine.filter((a) => a.status === "live");
  const ended = mine.filter((a) => a.status === "ended");
  const sold = ended.filter((a) => a.winnerId);
  const unsold = ended.filter((a) => !a.winnerId);
  return { live, ended, sold, unsold, orders, all: mine };
}

export async function payOrderDemo(orderId: string, buyerId: string) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.buyerId !== buyerId) throw new Error("Only the winner can pay.");
  if (order.status !== "awaiting_payment" && order.status !== "disputed") {
    throw new Error("This order is not awaiting payment.");
  }
  const paid: Order = {
    ...order,
    status: "paid",
    paidAt: new Date().toISOString(),
    stripePaymentId: order.stripePaymentId ?? `demo_${order.id.slice(0, 8)}`,
  };
  await upsertOrder(paid);
  await notifyUser({
    userId: order.sellerId,
    kind: "payment",
    title: "Buyer paid",
    body: `${order.title} was paid ($${order.amount}). Ready for payout.`,
    href: "/dashboard",
  });
  await notifyUser({
    userId: order.buyerId,
    kind: "payment",
    title: "Payment confirmed",
    body: `You paid $${order.amount} for ${order.title}.`,
    href: `/orders/${order.id}`,
  });
  return paid;
}

export async function markPayoutSent(orderId: string, sellerId: string) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.sellerId !== sellerId) throw new Error("Only the seller can confirm payout.");
  if (order.status !== "paid") throw new Error("Order must be paid first.");
  const next: Order = {
    ...order,
    status: "payout_sent",
    payoutAt: new Date().toISOString(),
  };
  await upsertOrder(next);

  const seller = await findUserById(sellerId);
  if (seller) {
    const soldCount = (await listOrders()).filter(
      (o) => o.sellerId === sellerId && (o.status === "paid" || o.status === "payout_sent"),
    ).length;
    if (soldCount >= 1 && !seller.verifiedSeller) {
      seller.verifiedSeller = true;
      await upsertUser(seller);
      await notifyUser({
        userId: sellerId,
        kind: "system",
        title: "Verified seller",
        body: "You earned a verified seller badge after a successful sale.",
        href: "/account",
      });
    }
  }

  await notifyUser({
    userId: order.sellerId,
    kind: "payout",
    title: "Payout recorded",
    body: `Payout for ${order.title} marked as sent.`,
    href: "/dashboard",
  });
  return next;
}

export async function createDispute(input: {
  orderId: string;
  openerId: string;
  reason: string;
}) {
  const order = await findOrderById(input.orderId);
  if (!order) throw new Error("Order not found.");
  if (order.buyerId !== input.openerId && order.sellerId !== input.openerId) {
    throw new Error("Not your order.");
  }
  if (order.status === "awaiting_payment") {
    throw new Error("Pay for the item before opening a dispute.");
  }
  const againstId =
    order.buyerId === input.openerId ? order.sellerId : order.buyerId;
  const dispute: Dispute = {
    id: randomUUID(),
    orderId: order.id,
    auctionId: order.auctionId,
    openerId: input.openerId,
    againstId,
    reason: input.reason.trim(),
    status: "open",
    resolution: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  await upsertDispute(dispute);
  order.status = "disputed";
  await upsertOrder(order);
  await notifyUser({
    userId: againstId,
    kind: "dispute",
    title: "New dispute",
    body: input.reason.trim().slice(0, 140),
    href: "/disputes",
  });
  return dispute;
}

export async function submitRating(input: {
  orderId: string;
  fromUserId: string;
  stars: number;
  comment: string;
}) {
  const order = await findOrderById(input.orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status !== "paid" && order.status !== "payout_sent") {
    throw new Error("Rate after the order is paid.");
  }
  if (input.fromUserId !== order.buyerId && input.fromUserId !== order.sellerId) {
    throw new Error("Not your order.");
  }
  const toUserId =
    input.fromUserId === order.buyerId ? order.sellerId : order.buyerId;
  const existing = (await listRatings()).find(
    (r) => r.orderId === order.id && r.fromUserId === input.fromUserId,
  );
  if (existing) throw new Error("You already rated this order.");
  const stars = Math.min(5, Math.max(1, Math.round(input.stars)));
  const rating: Rating = {
    id: randomUUID(),
    orderId: order.id,
    fromUserId: input.fromUserId,
    toUserId,
    stars,
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
  };
  await appendRating(rating);

  const allForUser = (await listRatings()).filter((r) => r.toUserId === toUserId);
  const avg =
    allForUser.reduce((sum, r) => sum + r.stars, 0) / (allForUser.length || 1);
  const user = await findUserById(toUserId);
  if (user) {
    user.ratingAvg = Math.round(avg * 10) / 10;
    user.ratingCount = allForUser.length;
    await upsertUser(user);
  }

  await notifyUser({
    userId: toUserId,
    kind: "rating",
    title: "New rating",
    body: `You received ${stars}★${rating.comment ? `: ${rating.comment}` : ""}`,
    href: "/account",
  });
  return rating;
}

export async function getBuyerOrders(buyerId: string) {
  await syncAuctionStatuses();
  return (await listOrders()).filter((o) => o.buyerId === buyerId);
}

export async function ensureOrderForAuction(auctionId: string) {
  await syncAuctionStatuses();
  return findOrderByAuctionId(auctionId);
}
