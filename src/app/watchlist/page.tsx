"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Auction } from "@/lib/types";
import styles from "../shared.module.css";

type Item = { auction: Auction };

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    void fetch("/api/watchlist")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const json = (await res.json()) as { items: Item[] };
        setItems(json.items || []);
      });
  }, [router]);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/auctions">← Auctions</Link>
        <p className={styles.brand}>Watchlist</p>
        <SettingsMenu />
      </header>
      <div className={styles.intro}>
        <h1>Watching</h1>
        <p>Lots you&apos;re tracking. We&apos;ll ping you when you&apos;re outbid or time is almost up.</p>
      </div>
      <div className={styles.grid}>
        {items.length === 0 && <div className={styles.empty}>No watched auctions yet.</div>}
        {items.map(({ auction }) => (
          <Link key={auction.id} href={`/auctions/${auction.id}`} className={styles.card}>
            <div className={styles.row}>
              <span className={styles.badge}>{auction.status}</span>
              <strong>{auction.title}</strong>
            </div>
            <p className={styles.muted}>
              ${auction.currentBid || auction.startingBid} · {auction.bidCount} bids
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
