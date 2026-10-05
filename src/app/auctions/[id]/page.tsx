"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import type { Auction, Bid } from "@/lib/types";
import { minNextBid } from "@/lib/types";
import styles from "./auction.module.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTimeLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Auction ended";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s left`;
  return `${m}m ${s}s left`;
}

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/auctions/${params.id}`);
      if (!res.ok) {
        if (!cancelled) setError("Auction not found.");
        return;
      }
      const json = (await res.json()) as { auction: Auction; bids: Bid[] };
      if (!cancelled) {
        setAuction(json.auction);
        setBids(json.bids);
        if (!amount) {
          setAmount(
            String(minNextBid(json.auction.currentBid, json.auction.startingBid)),
          );
        }
      }
    }

    void load();
    const poll = window.setInterval(() => void load(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const nextMin = useMemo(() => {
    if (!auction) return 1;
    return minNextBid(auction.currentBid, auction.startingBid);
  }, [auction]);

  async function onBid(event: React.FormEvent) {
    event.preventDefault();
    if (!auction) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/auctions/${auction.id}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    const json = (await res.json()) as {
      error?: string;
      auction?: Auction;
      bid?: Bid;
    };
    setBusy(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setError(json.error || "Bid failed.");
      return;
    }
    if (json.auction) setAuction(json.auction);
    if (json.bid) setBids((prev) => [json.bid!, ...prev]);
    setMessage("You're the high bidder.");
    setAmount(String(minNextBid(json.auction!.currentBid, json.auction!.startingBid)));
  }

  if (!auction && !error) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>Loading auction…</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className={styles.shell}>
        <p>{error}</p>
        <Link href="/auctions">← Back to auctions</Link>
      </div>
    );
  }

  void tick;

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/auctions">← Auctions</Link>
        <p className={styles.brand}>Resellr</p>
        <HeaderNav active="auctions" />
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={auction.photoDataUrl} alt={auction.title} />
          <div className={styles.heroCopy}>
            <div className={styles.badges}>
              <span className={auction.status === "live" ? styles.live : styles.ended}>
                {auction.status === "live" ? "LIVE" : "ENDED"}
              </span>
              <span className={styles.muted}>{formatTimeLeft(auction.endsAt)}</span>
            </div>
            <h1>{auction.title}</h1>
            <p className={styles.muted}>
              {auction.category} · {auction.condition}
            </p>
            <p className={styles.seller}>Seller: {auction.sellerName}</p>
            <p className={styles.bidLabel}>
              {auction.currentBid > 0 ? "Current bid" : "Starting bid"}
            </p>
            <p className={styles.bidValue}>
              {formatMoney(
                auction.currentBid > 0 ? auction.currentBid : auction.startingBid,
              )}
            </p>
            <p className={styles.muted}>
              {auction.bidCount} bid{auction.bidCount === 1 ? "" : "s"}
              {auction.currentBidderName
                ? ` · high bidder ${auction.currentBidderName}`
                : ""}
            </p>
            {auction.status === "ended" && (
              <p className={styles.result}>
                {auction.winnerName
                  ? `Sold to ${auction.winnerName} for ${formatMoney(auction.currentBid)}`
                  : "Ended with no winning bid"}
              </p>
            )}
          </div>
        </div>

        {auction.status === "live" && (
          <form className={styles.bidForm} onSubmit={onBid}>
            <label>
              Your bid (min {formatMoney(nextMin)})
              <input
                type="number"
                min={nextMin}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Placing…" : "Place bid"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.ok}>{message}</p>}
          </form>
        )}

        {auction.description && (
          <section className={styles.section}>
            <h2>Details</h2>
            <p>{auction.description}</p>
          </section>
        )}

        <section className={styles.section}>
          <h2>Bid history</h2>
          {bids.length === 0 ? (
            <p className={styles.muted}>No bids yet. Be the first.</p>
          ) : (
            <ul className={styles.bidList}>
              {bids.map((bid) => (
                <li key={bid.id}>
                  <span>{bid.bidderName}</span>
                  <strong>{formatMoney(bid.amount)}</strong>
                  <span className={styles.muted}>
                    {new Date(bid.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
