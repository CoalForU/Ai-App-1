"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Listing } from "@/lib/types";
import styles from "../auctions/auctions.module.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/listings");
      const json = (await res.json()) as { listings: Listing[] };
      if (!cancelled) {
        setListings(json.listings || []);
        setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 5000);
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
          <Link href="/auctions">Auctions</Link>
          <SettingsMenu />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Listings</h1>
          <p>
            Fixed-price finds from Resellr scanners. Buy now — or list your own
            after a scan.
          </p>
        </div>

        {loading && <p className={styles.muted}>Loading listings…</p>}

        {!loading && listings.length === 0 && (
          <section className={styles.empty}>
            <p>No active listings yet.</p>
            <Link href="/" className={styles.cta}>
              Scan an item to list one
            </Link>
          </section>
        )}

        <div className={styles.grid}>
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className={styles.card}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.photoDataUrl} alt={listing.title} />
              <div className={styles.cardBody}>
                <div className={styles.row}>
                  <span className={styles.live}>BUY NOW</span>
                  <span className={styles.muted}>{listing.condition}</span>
                </div>
                <h2>{listing.title}</h2>
                <p className={styles.price}>{formatMoney(listing.price)}</p>
                <p className={styles.muted}>
                  {listing.category} · {listing.sellerName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
