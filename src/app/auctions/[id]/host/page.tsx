"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { compressImageDataUrl } from "@/lib/image";
import type { Auction } from "@/lib/types";
import styles from "./host.module.css";

export default function AuctionHostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Starting camera…");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/auctions/${params.id}`);
      if (!res.ok) {
        if (!cancelled) setError("Auction not found.");
        return;
      }
      const json = (await res.json()) as { auction: Auction };
      if (!cancelled) setAuction(json.auction);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera required to host a live auction.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 960 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraOn(true);
        setStatus("You're live — buyers can see your camera.");

        interval = window.setInterval(() => {
          void pushFrame();
        }, 1500);
        void pushFrame();
      } catch {
        setError("Turn on your camera to go live. Bidding stays closed until you broadcast.");
      }
    }

    async function pushFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;
      canvas.width = Math.min(960, video.videoWidth);
      canvas.height = Math.round(
        (canvas.width / video.videoWidth) * video.videoHeight,
      );
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const raw = canvas.toDataURL("image/jpeg", 0.55);
      const frameDataUrl = await compressImageDataUrl(raw);
      const res = await fetch(`/api/auctions/${params.id}/frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameDataUrl }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error || "Could not push live frame.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      void fetch(`/api/auctions/${params.id}/frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stop: true }),
      });
      stopCamera();
    };
  }, [params.id, router, stopCamera]);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href={`/auctions/${params.id}`}>← Viewer</Link>
        <p className={styles.brand}>Host live</p>
        <HeaderNav active="auctions" />
      </header>

      <main className={styles.main}>
        <div className={styles.badgeRow}>
          <span className={cameraOn ? styles.live : styles.wait}>
            {cameraOn ? "CAMERA LIVE" : "CAMERA OFF"}
          </span>
          {auction && <span className={styles.muted}>{auction.title}</span>}
        </div>

        <div className={styles.viewfinder}>
          <video
            ref={videoRef}
            className={styles.video}
            playsInline
            muted
            autoPlay
          />
        </div>

        <p className={styles.status}>{status}</p>
        {error && <p className={styles.error}>{error}</p>}
        <p className={styles.muted}>
          Keep this page open with your camera on. Buyers watch this feed and
          can bid while you&apos;re broadcasting.
        </p>
        <Link href={`/auctions/${params.id}`} className={styles.link}>
          Open buyer view →
        </Link>
      </main>
      <canvas ref={canvasRef} className={styles.hidden} />
    </div>
  );
}
