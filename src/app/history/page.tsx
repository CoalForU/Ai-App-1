"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { ScanHistoryItem } from "@/lib/types";
import styles from "../shared.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/scan-history");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = (await res.json()) as { items: ScanHistoryItem[] };
      if (!cancelled) setItems(json.items || []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function feedback(id: string, value: "correct" | "wrong") {
    await fetch("/api/scan-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, feedback: value }),
    });
    const res = await fetch("/api/scan-history");
    if (res.ok) {
      const json = (await res.json()) as { items: ScanHistoryItem[] };
      setItems(json.items || []);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Scan</Link>
        <p className={styles.brand}>Scan history</p>
        <SettingsMenu />
      </header>
      <div className={styles.intro}>
        <h1>Past scans</h1>
        <p>Review IDs, barcodes/UPCs, and tell us when we got it wrong.</p>
      </div>
      <div className={styles.grid}>
        {items.length === 0 && <div className={styles.empty}>No scans saved yet.</div>}
        {items.map((item) => (
          <article key={item.id} className={styles.card}>
            <strong>{item.result.name}</strong>
            <p className={styles.muted}>
              {item.result.brand} · {item.result.category}
              {item.barcode ? ` · UPC ${item.barcode}` : ""}
            </p>
            <p className={styles.muted}>
              Suggested ${item.result.listAt}
              {item.feedback ? ` · marked ${item.feedback}` : ""}
            </p>
            {!item.feedback && (
              <div className={styles.row}>
                <button type="button" className={styles.btn} onClick={() => void feedback(item.id, "correct")}>
                  ID correct
                </button>
                <button type="button" className={styles.ghost} onClick={() => void feedback(item.id, "wrong")}>
                  ID wrong
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
