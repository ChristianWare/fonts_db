"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadsSettingsPage.module.css";

type Initial = {
  primaryCity: string;
  primaryState: string;
  serviceRadiusMiles: number;
  phoneNumber: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
};

export default function LeadsSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [city, setCity] = useState(initial.primaryCity);
  const [state, setState] = useState(initial.primaryState);
  const [radius, setRadius] = useState(initial.serviceRadiusMiles);
  const [phone, setPhone] = useState(initial.phoneNumber);
  const [smsEnabled, setSmsEnabled] = useState(initial.smsEnabled);
  const [emailEnabled, setEmailEnabled] = useState(initial.emailEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/leads/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryCity: city.trim(),
          primaryState: state.trim().toUpperCase(),
          serviceRadiusMiles: radius,
          phoneNumber: phone.trim(),
          smsEnabled,
          emailEnabled,
        }),
      });

      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Could not save your settings");
      }

      setSaved(true);
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
          Service radius (miles)
        </label>
        <input
          id='radius'
          type='number'
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10) || 50)}
          min={10}
          max={150}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor='phone' className={styles.label}>
          SMS phone number
        </label>
        <input
          id='phone'
          type='tel'
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.checkboxRow}>
        <input
          id='smsEnabled'
          type='checkbox'
          checked={smsEnabled}
          onChange={(e) => setSmsEnabled(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor='smsEnabled' className={styles.checkboxLabel}>
          Send me SMS alerts for new hot leads
        </label>
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
      {saved && <p className={styles.success}>Settings saved.</p>}

      <button type='submit' disabled={loading} className={styles.submit}>
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
