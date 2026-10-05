"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import styles from "./SettingsMenu.module.css";

type MeResponse = {
  user: null | {
    id: string;
    email: string;
    name: string;
  };
};

export function SettingsMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json: MeResponse) => {
        if (!cancelled) {
          setUser(json.user);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open settings"
        onClick={() => setOpen((value) => !value)}
      >
        Settings
      </button>

      {open && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close settings"
            onClick={() => setOpen(false)}
          />
          <div className={styles.panel} role="menu">
            <div className={styles.section}>
              <p className={styles.label}>Preferences</p>
              <div className={styles.themeRow} role="group" aria-label="Appearance">
                <button
                  type="button"
                  className={`${styles.themeBtn} ${theme === "light" ? styles.themeBtnActive : ""}`}
                  onClick={() => setTheme("light")}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`${styles.themeBtn} ${theme === "dark" ? styles.themeBtnActive : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <p className={styles.label}>Account</p>
              {loaded && user ? (
                <Link
                  href="/account"
                  className={styles.item}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Profile &amp; usage
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={styles.item}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className={styles.item}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    Create account
                  </Link>
                </>
              )}
              <Link
                href="/subscriptions"
                className={styles.item}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Subscriptions
              </Link>
            </div>

            <div className={styles.section}>
              <p className={styles.label}>Support</p>
              <a
                href="mailto:support@resellr.live"
                className={styles.item}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Contact support
              </a>
              <a
                href="https://resellr.live"
                className={styles.item}
                role="menuitem"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                About Resellr
              </a>
            </div>

            {loaded && user && (
              <div className={styles.section}>
                <button
                  type="button"
                  className={`${styles.item} ${styles.danger}`}
                  role="menuitem"
                  onClick={() => void logout()}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
