"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import type { Listing } from "@/lib/types";
import styles from "./listings.module.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PostsPage() {
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
        <Link href="/">← Scanner</Link>
        <p className={styles.brand}>Resellr</p>
        <div className={styles.topRight}>
          <HeaderNav active="listings" />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Listings</h1>
          <p>Fixed-price finds from the community. Tap Post to add yours.</p>
        </div>

        {loading && <p className={styles.muted}>Loading listings…</p>}

        {!loading && listings.length === 0 && (
          <section className={styles.empty}>
            <p>No listings yet.</p>
            <Link href="/listings/new" className={styles.cta}>
              Create the first listing
            </Link>
          </section>
        )}

        <div className={styles.feed}>
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className={styles.post}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.photoDataUrl} alt={listing.title} />
              <div className={styles.postBody}>
                <div className={styles.row}>
                  <span className={styles.pill}>POST</span>
                  <span className={styles.muted}>{listing.sellerName}</span>
                </div>
                <h2>{listing.title}</h2>
                <p className={styles.price}>{formatMoney(listing.price)}</p>
                <p className={styles.muted}>
                  {listing.category} · {listing.condition}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Link href="/listings/new" className={styles.postFab} aria-label="New post">
        <span aria-hidden>+</span>
        Post
      </Link>
    </div>
  );
}
