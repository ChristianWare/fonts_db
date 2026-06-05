"use client";

import { useState } from "react";
import { createBillingPortalSession } from "@/actions/client/createBillingPortalSession";
import styles from "./ManageBillingButton.module.css";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const result = await createBillingPortalSession();

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("url" in result && result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={styles.btn}
        type='button'
      >
        {loading ? "Opening..." : "Manage billing"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
