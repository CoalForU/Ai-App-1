"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DemandLabel, PriceWindow, ScanResult } from "@/lib/types";
import { SCAN_STORAGE_KEY } from "@/lib/types";
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
  const [photo] = useState<string | null>(readStoredPhoto);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState<PriceWindow>(30);

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
          body: JSON.stringify({ stub: true }),
        });
        if (!response.ok) throw new Error("Identify failed");
        const data = (await response.json()) as ScanResult;
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not identify this item. Try another photo.");
          setLoading(false);
        }
      }
    }

    void identify();
    return () => {
      cancelled = true;
    };
  }, [photo, router]);

  const sellThrough = useMemo(() => {
    if (!result) return null;
    return windowDays === 30 ? result.sellThrough30 : result.sellThrough60;
  }, [result, windowDays]);

  const history = useMemo(() => {
    if (!result) return [];
    return windowDays === 30 ? result.history30 : result.history60;
  }, [result, windowDays]);

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
        <p className={styles.brand}>FlipScout</p>
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

      {!loading && error && (
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
            <p className={styles.chartNote}>
              Stub data for Phase 1 — real marketplace history comes in Phase 2.
            </p>
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
                    <p className={styles.sourceLabel}>{source.label}</p>
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

          <section className={styles.ctaSection}>
            <button type="button" className={styles.primaryBtn} disabled>
              Generate listing
            </button>
            <p className={styles.ctaNote}>
              Listing generation lands in Phase 3.
            </p>
          </section>
        </main>
      )}
    </div>
  );
}
