import { getSessionUser } from "./auth";
import { currentMonthKey, getScanCount, incrementScanCount } from "./db";
import { PLAN_LIMITS } from "./types";

export async function getScanUsage() {
  const user = await getSessionUser();
  if (!user) {
    return {
      authenticated: false as const,
      plan: "basic" as const,
      limit: PLAN_LIMITS.basic.scansPerMonth,
      used: 0,
      remaining: PLAN_LIMITS.basic.scansPerMonth,
    };
  }

  const monthKey = currentMonthKey();
  const used = await getScanCount(user.id, monthKey);
  const limit = PLAN_LIMITS[user.plan].scansPerMonth;
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

export async function assertCanScan() {
  const usage = await getScanUsage();
  if (!usage.authenticated) {
    return { ok: false as const, reason: "auth", usage };
  }
  if (usage.limit != null && usage.used >= usage.limit) {
    return { ok: false as const, reason: "limit", usage };
  }
  return { ok: true as const, usage };
}

export async function recordScan(userId: string) {
  return incrementScanCount(userId, currentMonthKey());
}
