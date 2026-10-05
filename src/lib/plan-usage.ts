import { getSessionUser } from "./auth";
import {
  countSellerAuctionsInMonth,
  countSellerListingsInMonth,
  currentMonthKey,
} from "./db";
import { PLAN_LIMITS, type PlanId } from "./types";

export type UsageKind = "auctions" | "listings";

export async function getSellUsage(kind: UsageKind) {
  const user = await getSessionUser();
  const monthKey = currentMonthKey();
  if (!user) {
    const basic = PLAN_LIMITS.basic;
    const limit =
      basic.actionsPerMonth ??
      (kind === "auctions" ? basic.auctionsPerMonth : basic.listingsPerMonth);
    return {
      authenticated: false as const,
      plan: "basic" as PlanId,
      kind,
      pooled: basic.actionsPerMonth != null,
      limit,
      used: 0,
      remaining: limit,
      monthKey,
    };
  }

  const plan = PLAN_LIMITS[user.plan];
  const auctionsUsed = await countSellerAuctionsInMonth(user.id, monthKey);
  const listingsUsed = await countSellerListingsInMonth(user.id, monthKey);
  const pooled = plan.actionsPerMonth != null;
  const limit = pooled
    ? plan.actionsPerMonth
    : kind === "auctions"
      ? plan.auctionsPerMonth
      : plan.listingsPerMonth;
  const used = pooled
    ? auctionsUsed + listingsUsed
    : kind === "auctions"
      ? auctionsUsed
      : listingsUsed;
  const remaining = limit == null ? null : Math.max(0, limit - used);

  return {
    authenticated: true as const,
    userId: user.id,
    plan: user.plan,
    kind,
    pooled,
    limit,
    used,
    remaining,
    auctionsUsed,
    listingsUsed,
    monthKey,
  };
}

export async function assertCanSell(kind: UsageKind) {
  const usage = await getSellUsage(kind);
  if (!usage.authenticated) {
    return { ok: false as const, reason: "auth" as const, usage };
  }
  if (usage.limit != null && usage.used >= usage.limit) {
    return { ok: false as const, reason: "limit" as const, usage };
  }
  return { ok: true as const, usage };
}

export function limitReachedMessage(kind: UsageKind, plan: PlanId) {
  const limits = PLAN_LIMITS[plan];
  if (limits.actionsPerMonth != null) {
    return `You've hit your ${limits.name} limit of ${limits.actionsPerMonth} sell actions this month. Upgrade for more.`;
  }
  const cap =
    kind === "auctions" ? limits.auctionsPerMonth : limits.listingsPerMonth;
  const label = kind === "auctions" ? "live auctions" : "listings";
  return `You've hit your ${limits.name} limit of ${cap} ${label} this month. Upgrade for more.`;
}
