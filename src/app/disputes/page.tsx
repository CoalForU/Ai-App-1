"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Dispute } from "@/lib/types";
import styles from "../shared.module.css";

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    void fetch("/api/disputes").then(async (res) => {
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = (await res.json()) as { disputes: Dispute[] };
      setDisputes(json.disputes || []);
    });
  }, [router]);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/account">← Account</Link>
        <p className={styles.brand}>Disputes</p>
        <SettingsMenu />
      </header>
      <div className={styles.intro}>
        <h1>Trust &amp; disputes</h1>
        <p>Open cases after payment if something goes wrong with a sale.</p>
      </div>
      <div className={styles.grid}>
        {disputes.length === 0 && <div className={styles.empty}>No disputes.</div>}
        {disputes.map((d) => (
          <article key={d.id} className={styles.card}>
            <div className={styles.row}>
              <span className={styles.badge}>{d.status}</span>
              <strong>Order {d.orderId.slice(0, 8)}</strong>
            </div>
            <p className={styles.muted}>{d.reason}</p>
            <Link className={styles.ghost} href={`/orders/${d.orderId}`}>
              View order
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
