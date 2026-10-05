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
    const limit =
      kind === "auctions"
        ? PLAN_LIMITS.basic.auctionsPerMonth
        : PLAN_LIMITS.basic.listingsPerMonth;
    return {
      authenticated: false as const,
      plan: "basic" as PlanId,
      limit,
      used: 0,
      remaining: limit,
      monthKey,
    };
  }

  const plan = PLAN_LIMITS[user.plan];
  const limit =
    kind === "auctions" ? plan.auctionsPerMonth : plan.listingsPerMonth;
  const used =
    kind === "auctions"
      ? await countSellerAuctionsInMonth(user.id, monthKey)
      : await countSellerListingsInMonth(user.id, monthKey);
  const remaining = limit == null ? null : Math.max(0, limit - used);

  return {
    authenticated: true as const,
    userId: user.id,
    plan: user.plan,
    limit,
    used,
    remaining,
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
  const cap =
    kind === "auctions" ? limits.auctionsPerMonth : limits.listingsPerMonth;
  const label = kind === "auctions" ? "live auctions" : "listings";
  return `You've hit your ${PLAN_LIMITS[plan].name} limit of ${cap} ${label} this month. Upgrade for more.`;
}
