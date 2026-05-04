"use client";

import { useState } from "react";
import styles from "./EnrollLeadsPage.module.css";

type Props = {
  paywallEnabled: boolean;
};

export default function EnrollLeadsButton({ paywallEnabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const idleText = paywallEnabled
    ? "Start 7-day free trial"
    : "Get started — free";

  const loadingText = paywallEnabled
    ? "Starting your trial..."
    : "Setting things up...";

  return (
    <>
      <button
        type='button'
        onClick={handleClick}
        disabled={loading}
        className={styles.cta}
      >
        {loading ? loadingText : idleText}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
