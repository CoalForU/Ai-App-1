"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { ItemScanner } from "@/components/ItemScanner";
import styles from "./new.module.css";

type Step = "scan" | "details";

export default function NewPostPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("scan");
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [condition, setCondition] = useState("Used");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPhoto(dataUrl: string) {
    setPhoto(dataUrl);
    setStep("details");
    // Soft-fill title from identify if possible
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        result?: {
          name?: string;
          category?: string;
          condition?: string;
          listAt?: number;
          brand?: string;
        };
      };
      if (json.result) {
        setTitle(json.result.name || "");
        setCategory(json.result.category || "General");
        setCondition(json.result.condition || "Used");
        if (json.result.listAt) setPrice(String(json.result.listAt));
        setDescription(
          `${json.result.brand || ""} · ${json.result.category || ""}`.trim(),
        );
      }
    } catch {
      // keep manual fields
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!photo) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        condition,
        photoDataUrl: photo,
        price: Number(price),
      }),
    });
    const json = (await response.json()) as {
      listing?: { id: string };
      error?: string;
    };
    setBusy(false);
    if (response.status === 401) {
      router.push("/signup");
      return;
    }
    if (!response.ok || !json.listing) {
      setError(json.error || "Could not create post.");
      return;
    }
    router.push(`/listings/${json.listing.id}`);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/listings">← Listings</Link>
        <p className={styles.brand}>New listing</p>
        <HeaderNav active="listings" />
      </header>

      <main className={styles.main}>
        {step === "scan" && (
          <>
            <p className={styles.lead}>
              Scan the item you want to post. The scanner opens here as part of
              posting.
            </p>
            <ItemScanner
              onPhoto={onPhoto}
              hint="Snap or upload the item photo for your post."
            />
          </>
        )}

        {step === "details" && photo && (
          <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Post preview" className={styles.preview} />
            <button
              type="button"
              className={styles.rescan}
              onClick={() => {
                setStep("scan");
                setPhoto(null);
              }}
            >
              Rescan photo
            </button>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label>
              Price ($)
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              Category
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>
            <label>
              Condition
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? "Posting…" : "Publish post"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
