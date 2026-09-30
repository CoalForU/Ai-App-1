"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Auction } from "@/lib/types";
import { minNextBid } from "@/lib/types";
import styles from "./auctions.module.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function timeLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/auctions");
      const json = (await res.json()) as { auctions: Auction[] };
      if (!cancelled) {
        setAuctions(json.auctions || []);
        setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Scan</Link>
        <p className={styles.brand}>Resellr</p>
        <div className={styles.topRight}>
          <SettingsMenu />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Live auctions</h1>
          <p>
            Bid in real time on Resellr. Scan an item, start an auction, and let
            buyers compete here — no posting to other apps.
          </p>
        </div>

        {loading && <p className={styles.muted}>Loading auctions…</p>}

        {!loading && auctions.length === 0 && (
          <section className={styles.empty}>
            <p>No live auctions yet.</p>
            <Link href="/" className={styles.cta}>
              Scan an item to start one
            </Link>
          </section>
        )}

        <div className={styles.grid}>
          {auctions.map((auction) => {
            const ask =
              auction.currentBid > 0
                ? auction.currentBid
                : auction.startingBid;
            const next = minNextBid(auction.currentBid, auction.startingBid);
            return (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className={styles.card}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={auction.photoDataUrl} alt={auction.title} />
                <div className={styles.cardBody}>
                  <div className={styles.row}>
                    <span
                      className={
                        auction.status === "live" ? styles.live : styles.ended
                      }
                    >
                      {auction.status === "live" ? "LIVE" : "ENDED"}
                    </span>
                    <span className={styles.muted}>
                      {timeLeft(auction.endsAt)}
                    </span>
                  </div>
                  <h2>{auction.title}</h2>
                  <p className={styles.price}>
                    {auction.currentBid > 0 ? "Current" : "Starts at"}{" "}
                    {formatMoney(ask)}
                  </p>
                  <p className={styles.muted}>
                    {auction.bidCount} bid{auction.bidCount === 1 ? "" : "s"} ·
                    next {formatMoney(next)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
