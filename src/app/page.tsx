"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { ItemScanner } from "@/components/ItemScanner";
import { PLAN_LIMITS, SCAN_RESULT_KEY, SCAN_STORAGE_KEY, type PlanId } from "@/lib/types";
import styles from "./page.module.css";

type MeState = {
  authenticated: boolean;
  name?: string;
  plan?: PlanId;
  used?: number;
  limit?: number | null;
  remaining?: number | null;
};

type Mode = "camera" | "lookup";

export default function ScannerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("camera");
  const [query, setQuery] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [me, setMe] = useState<MeState>({ authenticated: false });

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then(
        (json: {
          user: null | { name: string; plan: PlanId };
          usage: null | {
            used: number;
            limit: number | null;
            remaining: number | null;
          };
        }) => {
          if (!json.user) {
            setMe({ authenticated: false });
            return;
          }
          setMe({
            authenticated: true,
            name: json.user.name,
            plan: json.user.plan,
            used: json.usage?.used ?? 0,
            limit: json.usage?.limit ?? PLAN_LIMITS.basic.scansPerMonth,
            remaining: json.usage?.remaining ?? null,
          });
        },
      );
  }, []);

  function gateOrRedirect() {
    if (!me.authenticated) {
      router.push("/signup");
      return false;
    }
    if (me.limit != null && (me.remaining ?? 0) <= 0) {
      router.push("/subscriptions");
      return false;
    }
    return true;
  }

  async function onPhoto(dataUrl: string) {
    if (!gateOrRedirect()) return;
    sessionStorage.setItem(SCAN_STORAGE_KEY, dataUrl);
    sessionStorage.removeItem(SCAN_RESULT_KEY);
    router.push("/results?from=scanner");
  }

  async function onLookup(event: React.FormEvent) {
    event.preventDefault();
    if (!gateOrRedirect()) return;
    setLookupBusy(true);
    setLookupError(null);
    const response = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = (await response.json()) as {
      result?: unknown;
      error?: string;
    };
    setLookupBusy(false);
    if (response.status === 401) {
      router.push("/signup");
      return;
    }
    if (response.status === 402) {
      router.push("/subscriptions");
      return;
    }
    if (!response.ok || !json.result) {
      setLookupError(json.error || "Lookup failed.");
      return;
    }
    sessionStorage.removeItem(SCAN_STORAGE_KEY);
    sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(json.result));
    router.push("/results?from=lookup");
  }

  const limitLabel = !me.authenticated
    ? "Sign in to use the scanner"
    : me.limit == null
      ? `${me.used ?? 0} checks this month · Unlimited`
      : `${me.used ?? 0} / ${me.limit} checks this month`;

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div>
          <p className={styles.brand}>Resellr</p>
          <p className={styles.tagline}>Scanner for thrift finds</p>
        </div>
        <div className={styles.topLinks}>
          <HeaderNav active="scanner" />
        </div>
      </header>

      {!me.authenticated && (
        <div className={styles.authBanner}>
          <p>Create a free Basic account to scan &amp; look up items.</p>
          <Link href="/signup">Sign up</Link>
        </div>
      )}

      <main className={styles.stage}>
        <div className={styles.modeToggle} role="tablist" aria-label="Scanner mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "camera"}
            className={mode === "camera" ? styles.modeActive : undefined}
            onClick={() => setMode("camera")}
          >
            Camera scan
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "lookup"}
            className={mode === "lookup" ? styles.modeActive : undefined}
            onClick={() => setMode("lookup")}
          >
            Manual lookup
          </button>
        </div>

        <p className={styles.usage}>{limitLabel}</p>

        {mode === "camera" ? (
          <ItemScanner
            onPhoto={onPhoto}
            hint="At a thrift store? Snap an item to check the market — no need to list it."
          />
        ) : (
          <form className={styles.lookupForm} onSubmit={(e) => void onLookup(e)}>
            <label>
              Item name or keywords
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Nike Dunk Low size 10"
                required
                minLength={2}
              />
            </label>
            <p className={styles.hint}>
              Type what you see on the tag or box. We&apos;ll pull comps without a
              photo.
            </p>
            <button type="submit" className={styles.lookupBtn} disabled={lookupBusy}>
              {lookupBusy ? "Looking up…" : "Check market"}
            </button>
            {lookupError && <p className={styles.lookupError}>{lookupError}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
