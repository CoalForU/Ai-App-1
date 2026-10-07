"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressImageDataUrl } from "@/lib/image";
import styles from "./ItemScanner.module.css";

type CameraState = "idle" | "starting" | "live" | "blocked" | "unsupported";

type ItemScannerProps = {
  /** Called with a compressed photo data URL. */
  onPhoto: (dataUrl: string) => void | Promise<void>;
  busy?: boolean;
  hint?: string;
  /** When false, don't auto-start the camera (e.g. lookup-only mode). */
  enableCamera?: boolean;
};

export function ItemScanner({
  onPhoto,
  busy = false,
  hint = "Point at the item to check market prices.",
  enableCamera = true,
}: ItemScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [capturing, setCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!enableCamera) return;
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
          stream.getTracks().forEach((t) => t.stop());
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

    const timer = window.setTimeout(() => void startCamera(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [enableCamera, stopCamera]);

  const handleDataUrl = useCallback(
    async (dataUrl: string) => {
      setCapturing(true);
      try {
        const compressed = await compressImageDataUrl(dataUrl);
        stopCamera();
        await onPhoto(compressed);
      } finally {
        setCapturing(false);
      }
    },
    [onPhoto, stopCamera],
  );

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraState !== "live" || capturing || busy) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    await handleDataUrl(canvas.toDataURL("image/jpeg", 0.92));
  }, [busy, cameraState, capturing, handleDataUrl]);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || busy) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          void handleDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [busy, handleDataUrl],
  );

  return (
    <div className={styles.wrap}>
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
                <p>Camera blocked.</p>
                <p className={styles.fallbackHint}>Upload a photo instead.</p>
              </>
            )}
            {cameraState === "unsupported" && (
              <>
                <p>Camera unavailable.</p>
                <p className={styles.fallbackHint}>Upload a photo instead.</p>
              </>
            )}
            {cameraState === "idle" && <p>Ready when you are.</p>}
          </div>
        )}
      </div>

      <p className={styles.hint}>{hint}</p>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={capturing || busy}
        >
          Upload
        </button>
        <button
          type="button"
          className={styles.shutter}
          aria-label="Take photo"
          onClick={() => void capturePhoto()}
          disabled={cameraState !== "live" || capturing || busy}
        >
          <span className={styles.shutterInner} />
        </button>
        <div className={styles.spacer} aria-hidden />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hidden}
        onChange={onFileChange}
      />
      <canvas ref={canvasRef} className={styles.hidden} />

      {(capturing || busy) && (
        <div className={styles.overlay} role="status">
          <div className={styles.spinner} />
          <p>Working…</p>
        </div>
      )}
    </div>
  );
}
