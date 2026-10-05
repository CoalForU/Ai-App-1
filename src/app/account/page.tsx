"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import {
  formatUsd,
  PLAN_LIMITS,
  priceForInterval,
  semiannualSavings,
  type BillingInterval,
  type PlanId,
} from "@/lib/types";
import styles from "./account.module.css";

type MeResponse = {
  user: null | {
    id: string;
    email: string;
    name: string;
    plan: PlanId;
  };
  usage: null | {
    used: number;
    limit: number | null;
    remaining: number | null;
  };
};

type SellUsage = {
  auctions: {
    used: number;
    limit: number | null;
  };
  listings: {
    used: number;
    limit: number | null;
  };
};

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);
  const [sellUsage, setSellUsage] = useState<SellUsage | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json: MeResponse) => {
        if (!json.user) {
          router.replace("/login");
          return;
        }
        setData(json);
      });
    void fetch("/api/sell-usage")
      .then((r) => r.json())
      .then((json: SellUsage) => setSellUsage(json));
  }, [router]);

  async function setPlan(plan: PlanId, interval: BillingInterval = "monthly") {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const json = (await response.json()) as {
      mode?: string;
      url?: string;
      message?: string;
      error?: string;
      plan?: PlanId;
    };
    if (!response.ok) {
      setMessage(json.error || "Could not update plan.");
      return;
    }
    if (json.mode === "stripe" && json.url) {
      window.location.assign(json.url);
      return;
    }
    setMessage(json.message || "Plan updated.");
    const me = (await fetch("/api/auth/me").then((r) => r.json())) as MeResponse;
    setData(me);
  }

  if (!data?.user) {
    return (
      <div className={styles.shell}>
        <p>Loading account…</p>
      </div>
    );
  }

  const plan = PLAN_LIMITS[data.user.plan];

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Scan</Link>
        <HeaderNav />
      </header>

      <main className={styles.main}>
        <h1>{data.user.name}</h1>
        <p className={styles.muted}>{data.user.email}</p>

        <section className={styles.card}>
          <h2>Current subscription</h2>
          <p className={styles.planName}>{plan.name}</p>
          <p className={styles.muted}>
            {data.usage?.limit == null
              ? `${data.usage?.used ?? 0} scans used this month · Unlimited`
              : `${data.usage?.used ?? 0} / ${data.usage?.limit} scans used this month`}
          </p>
          {sellUsage && (
            <>
              <p className={styles.muted}>
                {sellUsage.listings.limit == null
                  ? `${sellUsage.listings.used} listings this month · Unlimited`
                  : `${sellUsage.listings.used} / ${sellUsage.listings.limit} listings this month`}
              </p>
              <p className={styles.muted}>
                {sellUsage.auctions.limit == null
                  ? `${sellUsage.auctions.used} auctions this month · Unlimited`
                  : `${sellUsage.auctions.used} / ${sellUsage.auctions.limit} auctions this month`}
              </p>
            </>
          )}
          <div className={styles.row}>
            <button type="button" onClick={() => void setPlan("pro", "monthly")}>
              Pro {formatUsd(PLAN_LIMITS.pro.priceMonthly)}/mo
            </button>
            <button
              type="button"
              onClick={() => void setPlan("pro", "semiannual")}
            >
              Pro {formatUsd(priceForInterval("pro", "semiannual"))}/6mo (save{" "}
              {formatUsd(semiannualSavings("pro"))})
            </button>
            <button
              type="button"
              onClick={() => void setPlan("ultimate", "monthly")}
            >
              Ultimate {formatUsd(PLAN_LIMITS.ultimate.priceMonthly)}/mo
            </button>
            <button
              type="button"
              onClick={() => void setPlan("ultimate", "semiannual")}
            >
              Ultimate {formatUsd(priceForInterval("ultimate", "semiannual"))}
              /6mo (save {formatUsd(semiannualSavings("ultimate"))})
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => void setPlan("basic")}
            >
              Back to Basic
            </button>
          </div>
          <p className={styles.muted}>
            6-month Pro saves {formatUsd(semiannualSavings("pro"))}; Ultimate
            saves {formatUsd(semiannualSavings("ultimate"))} vs monthly.
          </p>
          <Link href="/subscriptions" className={styles.muted}>
            View all subscriptions →
          </Link>
          {message && <p className={styles.note}>{message}</p>}
        </section>
      </main>
    </div>
  );
}
