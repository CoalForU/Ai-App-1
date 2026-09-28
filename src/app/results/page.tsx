"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackgroundCleanup } from "@/components/BackgroundCleanup";
import type {
  DemandLabel,
  ListingDraft,
  PlanId,
  PriceWindow,
  ScanResult,
} from "@/lib/types";
import { SCAN_RESULT_KEY, SCAN_STORAGE_KEY } from "@/lib/types";
import styles from "./results.module.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function demandClass(demand: DemandLabel) {
  if (demand === "Hot") return styles.demandHot;
  if (demand === "Steady") return styles.demandSteady;
  return styles.demandSlow;
}

function readStoredPhoto() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SCAN_STORAGE_KEY);
}

function PriceHistoryGraph({
  points,
  windowDays,
}: {
  points: ScanResult["history30"];
  windowDays: PriceWindow;
}) {
  const width = 320;
  const height = 140;
  const padX = 8;
  const padY = 16;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices) - 4;
  const max = Math.max(...prices) + 4;

  const coords = points.map((point) => {
    const x = padX + (point.day / windowDays) * (width - padX * 2);
    const y =
      height -
      padY -
      ((point.price - min) / (max - min || 1)) * (height - padY * 2);
    return `${x},${y}`;
  });

  const line = coords.join(" ");
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Price history over ${windowDays} days`}
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(182, 242, 74, 0.35)" />
          <stop offset="100%" stopColor="rgba(182, 242, 74, 0)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(readStoredPhoto);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState<PriceWindow>(30);
  const [plan, setPlan] = useState<PlanId>("basic");
  const [listing, setListing] = useState<ListingDraft | null>(null);
  const [listingBusy, setListingBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json: { user: null | { plan: PlanId } }) => {
        if (json.user?.plan) setPlan(json.user.plan);
      });
  }, []);

  useEffect(() => {
    if (!photo) {
      router.replace("/");
      return;
    }

    let cancelled = false;

    async function identify() {
      try {
        const response = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: photo }),
        });
        const data = (await response.json()) as {
          result?: ScanResult;
          error?: string;
        };

        if (response.status === 401) {
          router.replace("/signup");
          return;
        }
        if (response.status === 402) {
          router.replace("/plans");
          return;
        }
        if (!response.ok || !data.result) {
          throw new Error(data.error || "Identify failed");
        }
        if (!cancelled) {
          setResult(data.result);
          sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(data.result));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not identify this item. Try another photo.",
          );
          setLoading(false);
        }
      }
    }

    void identify();
    return () => {
      cancelled = true;
    };
    // Identify once per results visit — photo cleanup must not re-scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const sellThrough = useMemo(() => {
    if (!result) return null;
    return windowDays === 30 ? result.sellThrough30 : result.sellThrough60;
  }, [result, windowDays]);

  const history = useMemo(() => {
    if (!result) return [];
    return windowDays === 30 ? result.history30 : result.history60;
  }, [result, windowDays]);

  async function generateListing() {
    if (!result) return;
    setListingBusy(true);
    try {
      const response = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      const json = (await response.json()) as {
        listing?: ListingDraft;
        error?: string;
      };
      if (!response.ok || !json.listing) {
        setError(json.error || "Could not generate listing.");
      } else {
        setListing(json.listing);
      }
    } finally {
      setListingBusy(false);
    }
  }

  async function copyField(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  }

  if (!photo) {
    return (
      <div className={styles.shell}>
        <p className={styles.loadingCopy}>Loading scan…</p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          ← New scan
        </Link>
        <p className={styles.brand}>Resellr</p>
        <Link href="/plans" className={styles.plansLink}>
          Plans
        </Link>
      </header>

      {loading && (
        <section className={styles.loadingPanel} role="status">
          <div className={styles.photoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Scanned item" className={styles.photo} />
          </div>
          <div className={styles.spinner} />
          <p className={styles.loadingCopy}>
            Identifying item and pulling market data…
          </p>
          <div className={styles.skeletonStack}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeletonShort} />
          </div>
        </section>
      )}

      {!loading && error && !result && (
        <section className={styles.errorPanel}>
          <p>{error}</p>
          <Link href="/" className={styles.primaryBtn}>
            Try again
          </Link>
        </section>
      )}

      {!loading && result && sellThrough && (
        <main className={styles.content}>
          <section className={styles.hero}>
            <div className={styles.photoWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={result.name} className={styles.photo} />
            </div>
            <div className={styles.heroCopy}>
              <p className={styles.meta}>
                {result.brand} · {result.category}
              </p>
              <h1 className={styles.title}>{result.name}</h1>
              <p className={styles.condition}>{result.condition}</p>
              <p className={styles.pricingMode}>
                Pricing: {result.pricingMode === "live" ? "Live eBay" : "Stub comps"}
              </p>
            </div>
          </section>

          <section className={styles.priceBlock}>
            <div className={styles.priceHeader}>
              <div>
                <p className={styles.sectionLabel}>Suggested list price</p>
                <p className={styles.listAt}>{formatMoney(result.listAt)}</p>
              </div>
              <div className={styles.rangeBox}>
                <p className={styles.sectionLabel}>Market range</p>
                <p className={styles.range}>
                  {formatMoney(result.priceLow)} –{" "}
                  {formatMoney(result.priceHigh)}
                </p>
              </div>
            </div>

            <div className={styles.demandRow}>
              <p className={styles.daysToSell}>
                Typically sells in{" "}
                <strong>{sellThrough.daysToSell} days</strong>
              </p>
              <span
                className={`${styles.demand} ${demandClass(sellThrough.demand)}`}
              >
                {sellThrough.demand}
              </span>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Price history</h2>
              <div
                className={styles.toggle}
                role="group"
                aria-label="History window"
              >
                <button
                  type="button"
                  className={windowDays === 30 ? styles.toggleActive : undefined}
                  onClick={() => setWindowDays(30)}
                >
                  30 days
                </button>
                <button
                  type="button"
                  className={windowDays === 60 ? styles.toggleActive : undefined}
                  onClick={() => setWindowDays(60)}
                >
                  60 days
                </button>
              </div>
            </div>
            <PriceHistoryGraph points={history} windowDays={windowDays} />
          </section>

          <section className={styles.section}>
            <h2>By marketplace</h2>
            <ul className={styles.sourceList}>
              {result.sources.map((source) => (
                <li key={source.source} className={styles.sourceItem}>
                  <span
                    className={`${styles.sourceDot} ${styles[source.source]}`}
                  />
                  <div>
                    <p className={styles.sourceLabel}>
                      {source.label}
                      {!source.live && (
                        <span className={styles.stubTag}> stub</span>
                      )}
                    </p>
                    <p className={styles.sourceRange}>
                      {formatMoney(source.low)} – {formatMoney(source.high)}
                    </p>
                  </div>
                  <p className={styles.sourceMedian}>
                    med {formatMoney(source.median)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Price vs speed</h2>
            <p className={styles.sectionSupport}>
              Same item, two strategies. Toggle 30/60 above to recalculate.
            </p>
            <div className={styles.optionGrid}>
              {sellThrough.options.map((option) => (
                <article key={option.label} className={styles.optionCard}>
                  <p className={styles.optionLabel}>{option.label}</p>
                  <p className={styles.optionPrice}>
                    {formatMoney(option.price)}
                  </p>
                  <p className={styles.optionDays}>
                    Sells in about {option.daysToSell}{" "}
                    {option.daysToSell === 1 ? "day" : "days"}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <BackgroundCleanup
            photo={photo}
            plan={plan}
            onPhotoChange={setPhoto}
          />

          <section className={styles.ctaSection}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void generateListing()}
              disabled={listingBusy}
            >
              {listingBusy ? "Writing listing…" : "Generate listing"}
            </button>
          </section>

          {listing && (
            <section className={styles.section}>
              <h2>Listing draft</h2>
              <label className={styles.field}>
                Title
                <div className={styles.fieldRow}>
                  <input
                    value={listing.title}
                    onChange={(e) =>
                      setListing({ ...listing, title: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void copyField("title", listing.title)}
                  >
                    {copied === "title" ? "Copied" : "Copy"}
                  </button>
                </div>
              </label>
              <label className={styles.field}>
                Category
                <div className={styles.fieldRow}>
                  <input
                    value={listing.category}
                    onChange={(e) =>
                      setListing({ ...listing, category: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void copyField("category", listing.category)}
                  >
                    {copied === "category" ? "Copied" : "Copy"}
                  </button>
                </div>
              </label>
              <label className={styles.field}>
                Description
                <div className={styles.fieldRow}>
                  <textarea
                    rows={6}
                    value={listing.description}
                    onChange={(e) =>
                      setListing({ ...listing, description: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void copyField("description", listing.description)
                    }
                  >
                    {copied === "description" ? "Copied" : "Copy"}
                  </button>
                </div>
              </label>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
