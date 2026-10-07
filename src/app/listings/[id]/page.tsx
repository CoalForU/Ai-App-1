"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import type { Listing } from "@/lib/types";
import styles from "../../auctions/[id]/auction.module.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json: { user: null | { id: string } }) => {
        setMeId(json.user?.id ?? null);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/listings/${params.id}`);
      if (!res.ok) {
        if (!cancelled) setError("Listing not found.");
        return;
      }
      const json = (await res.json()) as { listing: Listing };
      if (!cancelled) setListing(json.listing);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onBuy() {
    if (!listing) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/listings/${listing.id}/buy`, {
      method: "POST",
    });
    const json = (await res.json()) as { listing?: Listing; error?: string };
    setBusy(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok || !json.listing) {
      setError(json.error || "Could not buy listing.");
      return;
    }
    setListing(json.listing);
    setMessage("Purchase complete.");
  }

  async function onEnd() {
    if (!listing) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/listings/${listing.id}/end`, {
      method: "POST",
    });
    const json = (await res.json()) as { listing?: Listing; error?: string };
    setBusy(false);
    if (!res.ok || !json.listing) {
      setError(json.error || "Could not end listing.");
      return;
    }
    setListing(json.listing);
    setMessage("Listing ended.");
  }

  if (!listing && !error) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>Loading listing…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={styles.shell}>
        <p>{error}</p>
        <Link href="/listings">← Back to listings</Link>
      </div>
    );
  }

  const isSeller = meId != null && meId === listing.sellerId;
  const isActive = listing.status === "active";

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/listings">← Listings</Link>
        <p className={styles.brand}>Resellr</p>
        <HeaderNav active="listings" />
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.photoDataUrl} alt={listing.title} />
          <div className={styles.heroCopy}>
            <div className={styles.badges}>
              <span className={isActive ? styles.live : styles.ended}>
                {listing.status === "active"
                  ? "BUY NOW"
                  : listing.status === "sold"
                    ? "SOLD"
                    : "ENDED"}
              </span>
            </div>
            <h1>{listing.title}</h1>
            <p className={styles.muted}>
              {listing.category} · {listing.condition}
            </p>
            <p className={styles.seller}>Seller: {listing.sellerName}</p>
            <p className={styles.bidLabel}>List price</p>
            <p className={styles.bidValue}>{formatMoney(listing.price)}</p>
            {listing.status === "sold" && listing.buyerName && (
              <p className={styles.result}>
                Sold to {listing.buyerName} for {formatMoney(listing.price)}
              </p>
            )}
          </div>
        </div>

        {isActive && !isSeller && (
          <form
            className={styles.bidForm}
            onSubmit={(e) => {
              e.preventDefault();
              void onBuy();
            }}
          >
            <button type="submit" disabled={busy}>
              {busy ? "Buying…" : `Buy now · ${formatMoney(listing.price)}`}
            </button>
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.ok}>{message}</p>}
          </form>
        )}

        {isActive && isSeller && (
          <form
            className={styles.bidForm}
            onSubmit={(e) => {
              e.preventDefault();
              void onEnd();
            }}
          >
            <button type="submit" disabled={busy}>
              {busy ? "Ending…" : "End listing"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.ok}>{message}</p>}
          </form>
        )}

        {!isActive && message && <p className={styles.ok}>{message}</p>}
        {!isActive && error && <p className={styles.error}>{error}</p>}

        {listing.description && (
          <section className={styles.section}>
            <h2>Details</h2>
            <p>{listing.description}</p>
          </section>
        )}
      </main>
    </div>
  );
}
