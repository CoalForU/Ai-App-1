"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { AppNotification } from "@/lib/types";
import styles from "../shared.module.css";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/notifications");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = (await res.json()) as { notifications: AppNotification[] };
      if (!cancelled) setNotifications(json.notifications || []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const json = (await res.json()) as { notifications: AppNotification[] };
      setNotifications(json.notifications || []);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Scan</Link>
        <p className={styles.brand}>Notifications</p>
        <SettingsMenu />
      </header>
      <div className={styles.intro}>
        <h1>Alerts</h1>
        <p>Outbids, ending soon, wins, payments, disputes, and ratings.</p>
      </div>
      <div className={styles.row}>
        <button type="button" className={styles.ghost} onClick={() => void markAllRead()}>
          Mark all read
        </button>
      </div>
      <div className={styles.grid}>
        {notifications.length === 0 && <div className={styles.empty}>You&apos;re all caught up.</div>}
        {notifications.map((n) => (
          <article key={n.id} className={`${styles.card} ${n.read ? "" : styles.unread}`}>
            <div className={styles.row}>
              <span className={styles.badge}>{n.kind}</span>
              <strong>{n.title}</strong>
            </div>
            <p className={styles.muted}>{n.body}</p>
            {n.href && (
              <Link className={styles.ghost} href={n.href}>
                Open
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
