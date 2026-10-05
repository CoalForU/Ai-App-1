"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  SCAN_CLEAN_PHOTO_KEY,
  SCAN_STORAGE_KEY,
  type PlanId,
} from "@/lib/types";
import styles from "./BackgroundCleanup.module.css";

async function studioWhiteBackground(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const size = Math.max(img.width, img.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const x = Math.round((size - img.width) / 2);
  const y = Math.round((size - img.height) / 2);
  ctx.drawImage(img, x, y);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function BackgroundCleanup({
  photo,
  plan,
  onPhotoChange,
}: {
  photo: string;
  plan: PlanId;
  onPhotoChange?: (next: string) => void;
}) {
  const [before] = useState(photo);
  const [after, setAfter] = useState<string | null>(null);
  const [choice, setChoice] = useState<"before" | "after">("before");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const locked = plan === "basic";

  const keep = useCallback(
    (next: "before" | "after", cleaned?: string | null) => {
      setChoice(next);
      if (next === "after" && (cleaned || after)) {
        const value = cleaned || after!;
        sessionStorage.setItem(SCAN_CLEAN_PHOTO_KEY, value);
        sessionStorage.setItem(SCAN_STORAGE_KEY, value);
        onPhotoChange?.(value);
        return;
      }
      sessionStorage.setItem(SCAN_STORAGE_KEY, before);
      sessionStorage.removeItem(SCAN_CLEAN_PHOTO_KEY);
      onPhotoChange?.(before);
    },
    [after, before, onPhotoChange],
  );

  const runCleanup = useCallback(async () => {
    if (locked) return;
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: before }),
      });
      const json = (await response.json()) as {
        imageDataUrl?: string;
        mode?: string;
        note?: string;
        error?: string;
      };
      if (!response.ok || !json.imageDataUrl) {
        setNote(json.error || "Cleanup failed.");
        return;
      }

      let cleaned = json.imageDataUrl;
      if (json.mode === "passthrough") {
        cleaned = await studioWhiteBackground(before);
        setNote(
          json.note ||
            "Studio white backdrop applied. Add REMOVE_BG_API_KEY for full cutout.",
        );
      }
      setAfter(cleaned);
      keep("after", cleaned);
    } catch {
      setNote("Cleanup failed.");
    } finally {
      setBusy(false);
    }
  }, [before, keep, locked]);

  if (locked) {
    return (
      <section className={styles.section}>
        <h2>Photo cleanup</h2>
        <p className={styles.muted}>
          Auto background removal is an Ultimate perk.{" "}
          <Link href="/subscriptions">Upgrade to Ultimate</Link> to unlock it.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2>Photo cleanup</h2>
        <button type="button" onClick={() => void runCleanup()} disabled={busy}>
          {busy ? "Cleaning…" : after ? "Run again" : "Remove background"}
        </button>
      </div>
      {note && <p className={styles.muted}>{note}</p>}
      {after && (
        <>
          <div className={styles.compare}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={before} alt="Original scan" />
              <figcaption>Before</figcaption>
            </figure>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={after} alt="Cleaned scan" />
              <figcaption>After</figcaption>
            </figure>
          </div>
          <div className={styles.choiceRow}>
            <button
              type="button"
              className={choice === "before" ? styles.active : undefined}
              onClick={() => keep("before")}
            >
              Keep original
            </button>
            <button
              type="button"
              className={choice === "after" ? styles.active : undefined}
              onClick={() => keep("after")}
            >
              Keep cleaned
            </button>
          </div>
        </>
      )}
    </section>
  );
}
