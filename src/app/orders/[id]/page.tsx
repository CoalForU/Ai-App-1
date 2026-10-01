"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import type { Order, Rating } from "@/lib/types";
import styles from "../../shared.module.css";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) {
        router.replace("/login");
        return;
      }
      if (!cancelled) setMeId(me.user.id);
      const res = await fetch(`/api/orders/${params.id}`);
      if (!res.ok) {
        if (!cancelled) setMessage("Order not found.");
        return;
      }
      const json = (await res.json()) as { order: Order; ratings: Rating[] };
      if (!cancelled) {
        setOrder(json.order);
        setRatings(json.ratings || []);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  async function refresh() {
    const res = await fetch(`/api/orders/${params.id}`);
    if (!res.ok) return;
    const json = (await res.json()) as { order: Order; ratings: Rating[] };
    setOrder(json.order);
    setRatings(json.ratings || []);
  }

  async function pay() {
    const res = await fetch(`/api/orders/${params.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "demo" }),
    });
    const json = (await res.json()) as { error?: string; url?: string };
    if (json.url) {
      window.location.assign(json.url);
      return;
    }
    if (!res.ok) {
      setMessage(json.error || "Payment failed.");
      return;
    }
    setMessage("Payment confirmed.");
    void refresh();
  }

  async function rate() {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: params.id, stars, comment }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not rate.");
      return;
    }
    setMessage("Thanks for the rating.");
    void refresh();
  }

  async function openDispute() {
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: params.id, reason: disputeReason }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not open dispute.");
      return;
    }
    setMessage("Dispute opened.");
    void refresh();
  }

  if (!order) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>{message || "Loading order…"}</p>
      </div>
    );
  }

  const isBuyer = meId === order.buyerId;
  const alreadyRated = ratings.some((r) => r.fromUserId === meId);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href={isBuyer ? "/notifications" : "/dashboard"}>← Back</Link>
        <p className={styles.brand}>Order</p>
        <SettingsMenu />
      </header>

      <div className={styles.intro}>
        <h1>{order.title}</h1>
        <p>
          ${order.amount} · <span className={styles.badge}>{order.status}</span>
        </p>
      </div>

      {message && <p className={styles.muted}>{message}</p>}

      {isBuyer && order.status === "awaiting_payment" && (
        <button type="button" className={styles.btn} onClick={() => void pay()}>
          Pay now (demo checkout)
        </button>
      )}

      {(order.status === "paid" || order.status === "payout_sent") && !alreadyRated && (
        <section className={styles.card}>
          <h2>Rate this trade</h2>
          <label className={styles.muted}>
            Stars
            <select className={styles.select} value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <input
            className={styles.input}
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="button" className={styles.btn} onClick={() => void rate()}>
            Submit rating
          </button>
        </section>
      )}

      {(order.status === "paid" || order.status === "payout_sent" || order.status === "disputed") && (
        <section className={styles.card}>
          <h2>Open a dispute</h2>
          <input
            className={styles.input}
            placeholder="What went wrong?"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <button type="button" className={styles.danger} onClick={() => void openDispute()}>
            File dispute
          </button>
        </section>
      )}

      <Link className={styles.ghost} href={`/auctions/${order.auctionId}`}>
        View auction
      </Link>
    </div>
  );
}
