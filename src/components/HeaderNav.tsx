"use client";

import { SettingsMenu } from "./SettingsMenu";
import { BottomNav, type BottomNavActive } from "./BottomNav";
import styles from "./HeaderNav.module.css";

type HeaderNavProps = {
  active?: BottomNavActive | null;
};

/** Top-right Settings plus the bottom Scanner | Listings | Auctions bubble. */
export function HeaderNav({ active = null }: HeaderNavProps) {
  return (
    <>
      <div className={styles.topOnly}>
        <SettingsMenu />
      </div>
      <BottomNav active={active} />
    </>
  );
}
