"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import { PLAN_LIMITS, type PlanId } from "@/lib/types";
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

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);
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
  }, [router]);

  async function setPlan(plan: PlanId) {
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
        <SettingsMenu />
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
          <div className={styles.row}>
            <button type="button" onClick={() => void setPlan("pro")}>
              Switch to Pro ($15)
            </button>
            <button type="button" onClick={() => void setPlan("ultimate")}>
              Switch to Ultimate ($35)
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => void setPlan("basic")}
            >
              Back to Basic
            </button>
          </div>
          <Link href="/subscriptions" className={styles.muted}>
            View all subscriptions →
          </Link>
          {message && <p className={styles.note}>{message}</p>}
        </section>
      </main>
    </div>
  );
}
