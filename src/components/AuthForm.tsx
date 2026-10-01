"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./AuthForm.module.css";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className={styles.sub}>
        {mode === "login"
          ? "Sign in to keep scanning and track your monthly limit."
          : "Basic is free — 7 scans a month to start flipping."}
      </p>

      {mode === "signup" && (
        <label>
          Name
          <input
            name="name"
            placeholder="Marino"
            autoComplete="name"
            defaultValue=""
          />
        </label>
      )}

      <label>
        Email
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
          defaultValue=""
        />
      </label>

      <label>
        Password
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          defaultValue=""
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.primary} disabled={loading}>
        {loading ? "Working…" : mode === "login" ? "Sign in" : "Sign up"}
      </button>

      {mode === "login" && (
        <div className={styles.altAction}>
          <p>New to Resellr?</p>
          <Link href="/signup" className={styles.secondary}>
            Sign up
          </Link>
        </div>
      )}

      {mode === "signup" && (
        <div className={styles.altAction}>
          <p>Already have an account?</p>
          <Link href="/login" className={styles.secondary}>
            Sign in
          </Link>
        </div>
      )}
    </form>
  );
}
