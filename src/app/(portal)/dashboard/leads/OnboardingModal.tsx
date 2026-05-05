"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./OnboardingModal.module.css";

type Props = {
  welcomeFlow?: boolean;
};

export default function OnboardingModal({ welcomeFlow }: Props) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radius, setRadius] = useState(50);
  const [phone, setPhone] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Could not save your settings");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {welcomeFlow && (
          <p className={styles.welcomeBanner}>
            You&apos;re in. Let&apos;s set things up.
          </p>
        )}
        <h2 className={styles.title}>Set up your leads tool</h2>
        <p className={styles.subtitle}>
          Tell us where you operate so we can pull leads from the right markets.
          You can change any of this later in settings.
        </p>

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
                placeholder='Phoenix'
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
                placeholder='AZ'
                maxLength={2}
                required
                className={styles.input}
              />
            </div>
          </div>
          <span className={styles.hint}>
            The metro you primarily serve. Hot leads will be scraped from this
            market.
          </span>

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
            <span className={styles.hint}>
              How far you&apos;re willing to drive. 50 miles is typical for most
              metros.
            </span>
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
              placeholder='(602) 555-0188'
              required
              className={styles.input}
            />
            <span className={styles.hint}>
              We&apos;ll text you when a hot lead drops in your market.
            </span>
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

          {error && <p className={styles.error}>{error}</p>}

          <button type='submit' disabled={loading} className={styles.submit}>
            {loading ? "Saving..." : "Finish setup →"}
          </button>
        </form>
      </div>
    </div>
  );
}
