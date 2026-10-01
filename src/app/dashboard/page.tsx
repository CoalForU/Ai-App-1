"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Auction, Order } from "@/lib/types";
import styles from "../shared.module.css";

type Dash = {
  live: Auction[];
  sold: Auction[];
  unsold: Auction[];
  orders: Order[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dash | null>(null);
  const [tab, setTab] = useState<"live" | "sold" | "unsold" | "orders">("live");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = (await res.json()) as Dash;
      if (!cancelled) setData(json);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function refresh() {
    const res = await fetch("/api/dashboard");
    if (res.ok) setData((await res.json()) as Dash);
  }

  async function relist(id: string) {
    setMessage(null);
    const res = await fetch(`/api/auctions/${id}/relist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationHours: 24 }),
    });
    const json = (await res.json()) as { auction?: Auction; error?: string };
    if (!res.ok || !json.auction) {
      setMessage(json.error || "Could not relist.");
      return;
    }
    router.push(`/auctions/${json.auction.id}`);
  }

  async function payout(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/payout`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Payout failed.");
      return;
    }
    setMessage("Payout marked as sent.");
    void refresh();
  }

  if (!data) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>Loading seller dashboard…</p>
      </div>
    );
  }

  const list =
    tab === "live"
      ? data.live
      : tab === "sold"
        ? data.sold
        : tab === "unsold"
          ? data.unsold
          : [];

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Scan</Link>
        <p className={styles.brand}>Seller dashboard</p>
        <SettingsMenu />
      </header>

      <div className={styles.intro}>
        <h1>Your storefront</h1>
        <p>Live lots, sold items, unsold inventory, and payouts — all in one place.</p>
      </div>

      <div className={styles.tabs}>
        {(
          [
            ["live", `Live (${data.live.length})`],
            ["sold", `Sold (${data.sold.length})`],
            ["unsold", `Unsold (${data.unsold.length})`],
            ["orders", `Orders (${data.orders.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? styles.tabActive : styles.tab}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p className={styles.muted}>{message}</p>}

      {tab !== "orders" && (
        <div className={styles.grid}>
          {list.length === 0 && <div className={styles.empty}>Nothing here yet.</div>}
          {list.map((auction) => (
            <article key={auction.id} className={styles.card}>
              <div className={styles.row}>
                <span className={styles.badge}>{auction.status.toUpperCase()}</span>
                <strong>{auction.title}</strong>
              </div>
              <p className={styles.muted}>
                {auction.bidCount} bids · current ${auction.currentBid || auction.startingBid}
                {auction.winnerName ? ` · winner ${auction.winnerName}` : ""}
              </p>
              <div className={styles.row}>
                <Link className={styles.ghost} href={`/auctions/${auction.id}`}>
                  Open
                </Link>
                {tab === "unsold" && (
                  <button type="button" className={styles.btn} onClick={() => void relist(auction.id)}>
                    Relist
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className={styles.grid}>
          {data.orders.length === 0 && <div className={styles.empty}>No orders yet.</div>}
          {data.orders.map((order) => (
            <article key={order.id} className={styles.card}>
              <div className={styles.row}>
                <span className={styles.badge}>{order.status}</span>
                <strong>{order.title}</strong>
              </div>
              <p className={styles.muted}>${order.amount}</p>
              <div className={styles.row}>
                <Link className={styles.ghost} href={`/orders/${order.id}`}>
                  Details
                </Link>
                {order.status === "paid" && (
                  <button type="button" className={styles.btn} onClick={() => void payout(order.id)}>
                    Mark payout sent
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
