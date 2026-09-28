"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLAN_LIMITS, type PlanId } from "@/lib/types";
import styles from "./plans.module.css";

const plans = [
  {
    id: "basic" as const,
    name: "Basic",
    price: "$0",
    cadence: "forever",
    blurb: "Feel the loop. Scan a few finds a month.",
    featured: false,
    perks: [
      { label: "~7 scans / month", included: true },
      { label: "Sell-through data", included: true },
      { label: "Listing generation", included: true },
      { label: "Background removal", included: false },
      { label: "Priority support", included: false },
      { label: "Custom notifications", included: false },
      { label: "Price alerts", included: false },
      { label: "Market data", included: false },
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$15",
    cadence: "/ month",
    blurb: "For part-time flippers who scan every weekend.",
    featured: true,
    perks: [
      { label: "~25 scans / month", included: true },
      { label: "Sell-through data", included: true },
      { label: "Listing generation", included: true },
      { label: "Background removal", included: true },
      { label: "Priority support", included: true },
      { label: "Custom notifications", included: true },
      { label: "Price alerts", included: false },
      { label: "Market data", included: false },
    ],
  },
  {
    id: "ultimate" as const,
    name: "Ultimate",
    price: "$35",
    cadence: "/ month",
    blurb: "Unlimited sourcing for full-time resellers.",
    featured: false,
    perks: [
      { label: "Unlimited scans", included: true },
      { label: "Sell-through data", included: true },
      { label: "Listing generation", included: true },
      { label: "Background removal", included: true },
      { label: "Priority support", included: true },
      { label: "Custom notifications", included: true },
      { label: "Price alerts", included: true },
      { label: "Market data", included: true },
    ],
  },
];

export default function PlansPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
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
      body: JSON.stringify({ plan }),
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
        <p className={styles.brand}>FlipScout</p>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Plans</h1>
          <p>
            Basic gets you hooked. Pro is the weekend flipper pick. Ultimate is
            for people who live in thrift stores.
          </p>
          {message && <p className={styles.message}>{message}</p>}
        </div>

        <div className={styles.grid}>
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <article
                key={plan.name}
                className={`${styles.card} ${plan.featured ? styles.featured : ""}`}
              >
                {plan.featured && <p className={styles.badge}>Most popular</p>}
                <h2>{plan.name}</h2>
                <p className={styles.price}>
                  <span>{plan.price}</span>
                  <small>{plan.cadence}</small>
                </p>
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
