"use client";

import Link from "next/link";
import styles from "./BottomNav.module.css";

export type BottomNavActive = "scanner" | "listings" | "auctions";

const items: Array<{ id: BottomNavActive; href: string; label: string }> = [
  { id: "scanner", href: "/", label: "Scanner" },
  { id: "listings", href: "/listings", label: "Listings" },
  { id: "auctions", href: "/auctions", label: "Auctions" },
];

export function BottomNav({
  active = null,
}: {
  active?: BottomNavActive | null;
}) {
  return (
    <nav className={styles.dock} aria-label="Primary">
      <div className={styles.bubble}>
        {items.map((item, index) => (
          <span key={item.id} className={styles.slot}>
            {index > 0 && <span className={styles.divider} aria-hidden />}
            {active === item.id ? (
              <span className={styles.active} aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
