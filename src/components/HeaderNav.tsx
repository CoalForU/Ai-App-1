"use client";

import Link from "next/link";
import { SettingsMenu } from "./SettingsMenu";
import styles from "./HeaderNav.module.css";

type HeaderNavProps = {
  active?: "scanner" | "posts" | "auctions" | null;
};

export function HeaderNav({ active = null }: HeaderNavProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.market}>
        {active !== "scanner" ? (
          <Link href="/" className={styles.marketLink}>
            Scanner
          </Link>
        ) : (
          <span className={styles.marketHere} aria-current="page">
            Scanner
          </span>
        )}
        <span className={styles.rule} aria-hidden />
        {active !== "posts" ? (
          <Link href="/listings" className={styles.marketLink}>
            Posts
          </Link>
        ) : (
          <span className={styles.marketHere} aria-current="page">
            Posts
          </span>
        )}
        <span className={styles.rule} aria-hidden />
        {active !== "auctions" ? (
          <Link href="/auctions" className={styles.marketLink}>
            Live
          </Link>
        ) : (
          <span className={styles.marketHere} aria-current="page">
            Live
          </span>
        )}
      </div>
      <SettingsMenu />
    </nav>
  );
}
