"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { compressImageDataUrl } from "@/lib/image";
import {
  PLAN_LIMITS,
  SCAN_STORAGE_KEY,
  type PlanId,
} from "@/lib/types";
import styles from "./page.module.css";

type CameraState = "idle" | "starting" | "live" | "blocked" | "unsupported";

type MeState = {
  authenticated: boolean;
  name?: string;
  plan?: PlanId;
  used?: number;
  limit?: number | null;
  remaining?: number | null;
};

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [isCapturing, setIsCapturing] = useState(false);
  const [me, setMe] = useState<MeState>({ authenticated: false });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setCameraState("unsupported");
        return;
      }

      if (!cancelled) setCameraState("starting");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!cancelled) setCameraState("live");
      } catch {
        if (!cancelled) setCameraState("blocked");
      }
    }

    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [stopCamera]);

  const goToResults = useCallback(
    async (dataUrl: string) => {
      if (!me.authenticated) {
        router.push("/signup");
        return;
      }
      if (me.limit != null && (me.remaining ?? 0) <= 0) {
        router.push("/plans");
        return;
      }

      const compressed = await compressImageDataUrl(dataUrl);
      sessionStorage.setItem(SCAN_STORAGE_KEY, compressed);
      stopCamera();
      router.push("/results");
    },
    [me, router, stopCamera],
  );

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraState !== "live" || isCapturing) return;

    setIsCapturing(true);
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    try {
      await goToResults(dataUrl);
    } catch {
      setIsCapturing(false);
    }
  }, [cameraState, goToResults, isCapturing]);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsCapturing(true);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          setIsCapturing(false);
          return;
        }
        void goToResults(reader.result).catch(() => setIsCapturing(false));
      };
      reader.onerror = () => setIsCapturing(false);
      reader.readAsDataURL(file);
    },
    [goToResults],
  );

  const limitLabel = !me.authenticated
    ? "Sign in to start scanning"
    : me.limit == null
      ? `${me.used ?? 0} scans this month · Unlimited`
      : `${me.used ?? 0} / ${me.limit} scans this month`;

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div>
          <p className={styles.brand}>Resellr</p>
          <p className={styles.tagline}>Scan. Price. Auction.</p>
        </div>
        <div className={styles.topLinks}>
          <ThemeToggle />
          <Link className={styles.plansLink} href="/auctions">
            Auctions
          </Link>
          <Link className={styles.plansLink} href="/plans">
            Plans
          </Link>
          {me.authenticated ? (
            <Link className={styles.plansLink} href="/account">
              Account
            </Link>
          ) : (
            <Link className={styles.plansLink} href="/login">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {!me.authenticated && (
        <div className={styles.authBanner}>
          <p>Create a free Basic account to scan (~7 / month).</p>
          <Link href="/signup">Sign up</Link>
        </div>
      )}

      <main className={styles.stage}>
        <div className={styles.viewfinder}>
          <video
            ref={videoRef}
            className={styles.video}
            playsInline
            muted
            autoPlay
          />
          <div className={styles.frame} aria-hidden />

          {cameraState !== "live" && (
            <div className={styles.fallback}>
              {cameraState === "starting" && <p>Starting camera…</p>}
              {cameraState === "blocked" && (
                <>
                  <p>Camera access blocked.</p>
                  <p className={styles.fallbackHint}>
                    Upload a photo from your library instead.
                  </p>
                </>
              )}
              {cameraState === "unsupported" && (
                <>
                  <p>Camera not available here.</p>
                  <p className={styles.fallbackHint}>
                    Upload a photo to continue.
                  </p>
                </>
              )}
              {cameraState === "idle" && <p>Ready when you are.</p>}
            </div>
          )}
        </div>

        <p className={styles.hint}>
          Point at the item. We&apos;ll ID it, show market prices, and you can
          start a live auction on Resellr.
        </p>
        <p className={styles.usage}>{limitLabel}</p>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={() => {
              if (!me.authenticated) {
                router.push("/signup");
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={isCapturing}
          >
            Upload
          </button>

          <button
            type="button"
            className={styles.shutter}
            aria-label="Take photo"
            onClick={() => void capturePhoto()}
            disabled={cameraState !== "live" || isCapturing}
          >
            <span className={styles.shutterInner} />
          </button>

          <div className={styles.controlSpacer} aria-hidden />
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hiddenInput}
        onChange={onFileChange}
      />
      <canvas ref={canvasRef} className={styles.hiddenInput} />

      {isCapturing && (
        <div className={styles.capturingOverlay} role="status">
          <div className={styles.spinner} />
          <p>Opening results…</p>
        </div>
      )}
    </div>
  );
}
