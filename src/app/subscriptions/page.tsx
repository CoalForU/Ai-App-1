"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import {
  formatUsd,
  PLAN_LIMITS,
  priceForInterval,
  semiannualSavings,
  type BillingInterval,
  type PlanId,
} from "@/lib/types";
import styles from "./subscriptions.module.css";

const planDefs = [
  {
    id: "basic" as const,
    name: "Basic",
    blurb: "Feel the loop. Scan a few finds a month.",
    featured: false,
    perks: [
      { label: "~7 scans / month", included: true },
      { label: "Sell-through data", included: true },
      { label: "Live auctions", included: true },
      { label: "Priority support", included: false },
      { label: "Background removal", included: false },
      { label: "Custom notifications", included: false },
      { label: "Price alerts", included: false },
      { label: "Market data", included: false },
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    blurb: "For part-time flippers who scan every weekend.",
    featured: true,
    perks: [
      { label: "~25 scans / month", included: true },
      { label: "Sell-through data", included: true },
      { label: "Live auctions", included: true },
      { label: "Priority support", included: true },
      { label: "Background removal", included: false },
      { label: "Custom notifications", included: false },
      { label: "Price alerts", included: false },
      { label: "Market data", included: false },
    ],
  },
  {
    id: "ultimate" as const,
    name: "Ultimate",
    blurb: "Unlimited sourcing for full-time resellers.",
    featured: false,
    perks: [
      { label: "Unlimited scans", included: true },
      { label: "Sell-through data", included: true },
      { label: "Live auctions", included: true },
      { label: "Priority support", included: true },
      { label: "Background removal", included: true },
      { label: "Custom notifications", included: true },
      { label: "Price alerts", included: true },
      { label: "Market data", included: true },
    ],
  },
];

function priceLabel(planId: PlanId, interval: BillingInterval) {
  const monthly = PLAN_LIMITS[planId].priceMonthly;
  if (monthly === 0) {
    return { price: "$0", cadence: "forever" };
  }
  if (interval === "semiannual") {
    return {
      price: formatUsd(priceForInterval(planId, "semiannual")),
      cadence: "/ 6 months",
    };
  }
  return { price: formatUsd(monthly), cadence: "/ month" };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json: { user: null | { plan: PlanId } }) => {
        setCurrentPlan(json.user?.plan ?? null);
      });
  }, []);

  async function choosePlan(plan: PlanId) {
    if (!currentPlan && plan !== "basic") {
      router.push("/signup");
      return;
    }
    setBusy(plan);
    setMessage(null);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        interval: plan === "basic" ? "monthly" : interval,
      }),
    });
    const json = (await response.json()) as {
      mode?: string;
      url?: string;
      message?: string;
      error?: string;
    };
    setBusy(null);

    if (response.status === 401) {
      router.push("/signup");
      return;
    }
    if (!response.ok) {
      setMessage(json.error || "Could not update plan.");
      return;
    }
    if (json.mode === "stripe" && json.url) {
      window.location.assign(json.url);
      return;
    }
    setCurrentPlan(plan);
    setMessage(json.message || `You're on ${PLAN_LIMITS[plan].name}.`);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          ← Back to scan
        </Link>
        <p className={styles.brand}>Resellr</p>
        <div className={styles.topRight}>
          <Link href="/auctions">Auctions</Link>
          <SettingsMenu />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Subscriptions</h1>
          <p>
            Basic gets you hooked. Pro is the weekend flipper pick. Ultimate is
            for people who live in thrift stores.
          </p>
          <div className={styles.billingToggle} role="group" aria-label="Billing period">
            <button
              type="button"
              className={interval === "monthly" ? styles.billingActive : undefined}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={
                interval === "semiannual" ? styles.billingActive : undefined
              }
              onClick={() => setInterval("semiannual")}
            >
              6 months
              <span className={styles.saveTag}>Save 5%</span>
            </button>
          </div>
          {message && <p className={styles.message}>{message}</p>}
        </div>

        <div className={styles.grid}>
          {planDefs.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const { price, cadence } = priceLabel(plan.id, interval);
            return (
              <article
                key={plan.name}
                className={`${styles.card} ${plan.featured ? styles.featured : ""}`}
              >
                {plan.featured && <p className={styles.badge}>Most popular</p>}
                <h2>{plan.name}</h2>
                <p className={styles.price}>
                  <span>{price}</span>
                  <small>{cadence}</small>
                </p>
                {plan.id !== "basic" && interval === "semiannual" && (
                  <p className={styles.savingsNote}>
                    Save {formatUsd(semiannualSavings(plan.id))} vs{" "}
                    {formatUsd(PLAN_LIMITS[plan.id].priceMonthly * 6)} monthly
                  </p>
                )}
                <p className={styles.blurb}>{plan.blurb}</p>
                <ul>
                  {plan.perks.map((perk) => (
                    <li
                      key={perk.label}
                      className={perk.included ? styles.yes : styles.no}
                    >
                      <span aria-hidden>{perk.included ? "✓" : "—"}</span>
                      {perk.label}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.cta}
                  disabled={isCurrent || busy === plan.id}
                  onClick={() => void choosePlan(plan.id)}
                >
                  {isCurrent
                    ? "Current plan"
                    : busy === plan.id
                      ? "Working…"
                      : plan.id === "basic"
                        ? "Use Basic"
                        : `Get ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
