"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Auction } from "@/lib/types";
import { minNextBid } from "@/lib/types";
import styles from "./auctions.module.css";
import shared from "../shared.module.css";

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
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [sort, setSort] = useState<"ending" | "hot" | "newest" | "price">("ending");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (size) params.set("size", size);
      params.set("sort", sort);
      const res = await fetch(`/api/auctions?${params.toString()}`);
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
  }, [q, category, brand, size, sort]);

  const hot = useMemo(
    () => [...auctions].filter((a) => a.status === "live").sort((a, b) => b.bidCount - a.bidCount).slice(0, 3),
    [auctions],
  );

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Scan</Link>
        <p className={styles.brand}>Resellr</p>
        <div className={styles.topRight}>
          <Link href="/watchlist">Watchlist</Link>
          <SettingsMenu />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Discover auctions</h1>
          <p>
            Search by brand, category, or size. Sort by ending soon or what&apos;s hot
            right now.
          </p>
        </div>

        <div className={shared.filters}>
          <input
            className={shared.input}
            placeholder="Search titles, brands…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className={shared.input}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className={shared.input}
            placeholder="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <input
            className={shared.input}
            placeholder="Size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
          <select
            className={shared.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="ending">Ending soon</option>
            <option value="hot">Hot right now</option>
            <option value="newest">Newest</option>
            <option value="price">Highest bid</option>
          </select>
        </div>

        {!loading && hot.length > 0 && sort !== "hot" && (
          <section>
            <h2 className={styles.sectionTitle}>Hot right now</h2>
            <div className={styles.grid}>
              {hot.map((auction) => (
                <Link key={`hot-${auction.id}`} href={`/auctions/${auction.id}`} className={styles.card}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={auction.photoDataUrl} alt={auction.title} />
                  <div className={styles.cardBody}>
                    <span className={styles.live}>HOT</span>
                    <h2>{auction.title}</h2>
                    <p className={styles.muted}>{auction.bidCount} bids</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading && <p className={styles.muted}>Loading auctions…</p>}

        {!loading && auctions.length === 0 && (
          <section className={styles.empty}>
            <p>No auctions match those filters.</p>
            <Link href="/" className={styles.cta}>
              Scan an item to start one
            </Link>
          </section>
        )}

        <div className={styles.grid}>
          {auctions.map((auction) => {
            const ask =
              auction.currentBid > 0 ? auction.currentBid : auction.startingBid;
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
                    <span className={styles.muted}>{timeLeft(auction.endsAt)}</span>
                  </div>
                  <h2>{auction.title}</h2>
                  <p className={styles.price}>
                    {auction.currentBid > 0 ? "Current" : "Starts at"}{" "}
                    {formatMoney(ask)}
                  </p>
                  <p className={styles.muted}>
                    {auction.bidCount} bid{auction.bidCount === 1 ? "" : "s"} · next{" "}
                    {formatMoney(next)}
                    {auction.brand ? ` · ${auction.brand}` : ""}
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
