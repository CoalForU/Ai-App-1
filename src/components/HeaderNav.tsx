"use client";

import Link from "next/link";
import { SettingsMenu } from "./SettingsMenu";
import styles from "./HeaderNav.module.css";

type HeaderNavProps = {
  /** Hide a link when you're already on that section. */
  active?: "listings" | "auctions" | null;
};

export function HeaderNav({ active = null }: HeaderNavProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.market}>
        {active !== "listings" ? (
          <Link href="/listings" className={styles.marketLink}>
            Listings
          </Link>
        ) : (
          <span className={styles.marketHere} aria-current="page">
            Listings
          </span>
        )}
        <span className={styles.rule} aria-hidden />
        {active !== "auctions" ? (
          <Link href="/auctions" className={styles.marketLink}>
            Auctions
          </Link>
        ) : (
          <span className={styles.marketHere} aria-current="page">
            Auctions
          </span>
        )}
      </div>
      <SettingsMenu />
    </nav>
  );
}
