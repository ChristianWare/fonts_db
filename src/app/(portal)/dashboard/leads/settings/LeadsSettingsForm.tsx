"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadsSettingsPage.module.css";

type Initial = {
  primaryCity: string;
  primaryState: string;
  serviceRadiusMiles: number;
  emailEnabled: boolean;
};

type SaveResponse = {
  error?: string;
  success?: boolean;
  geocoded?: boolean;
  scrapeQueued?: boolean;
};

const RADIUS_OPTIONS = [5, 10, 20, 50, 75] as const;

export default function LeadsSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [city, setCity] = useState(initial.primaryCity);
  const [state, setState] = useState(initial.primaryState);

  // Existing users may have a radius value (e.g. 25, 100) that's not in
  // the new fixed list. Normalize to the closest preset so the select
  // doesn't render with no option selected.
  const initialRadius = (RADIUS_OPTIONS as readonly number[]).includes(
    initial.serviceRadiusMiles,
  )
    ? initial.serviceRadiusMiles
    : 50;
  const [radius, setRadius] = useState(initialRadius);

  const [emailEnabled, setEmailEnabled] = useState(initial.emailEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/leads/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryCity: city.trim(),
          primaryState: state.trim().toUpperCase(),
          serviceRadiusMiles: radius,
          emailEnabled,
        }),
      });

      const text = await res.text();
      let data: SaveResponse = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Could not save your settings");
      }

      if (data.scrapeQueued) {
        setSuccessMessage(
          "Settings saved. Your market is being prepared — warm leads will appear in a few minutes.",
        );
      } else {
        setSuccessMessage("Settings saved.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fieldRow2col}>
        <div className={styles.field}>
          <label htmlFor='city' className={styles.label}>
            Primary city
          </label>
          <input
            id='city'
            type='text'
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor='state' className={styles.label}>
            State
          </label>
          <input
            id='state'
            type='text'
            value={state}
            onChange={(e) => setState(e.target.value)}
            maxLength={2}
            required
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor='radius' className={styles.label}>
          Service radius
        </label>
        <select
          id='radius'
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          className={styles.select}
        >
          {RADIUS_OPTIONS.map((miles) => (
            <option key={miles} value={miles}>
              {miles} miles
            </option>
          ))}
        </select>
      </div>

      <div className={styles.checkboxRow}>
        <input
          id='emailEnabled'
          type='checkbox'
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor='emailEnabled' className={styles.checkboxLabel}>
          Send me email digests of new leads
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <button type='submit' disabled={loading} className={styles.submit}>
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
