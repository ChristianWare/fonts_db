/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadsSettingsPage.module.css";
import QuotaWarningModal from "./QuotaWarningModal";

type Initial = {
  primaryCity: string;
  primaryState: string;
  serviceRadiusMiles: number;
  emailEnabled: boolean;
};

type QuotaInfo = {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
};

type SaveResponse = {
  error?: string;
  success?: boolean;
  geocoded?: boolean;
  scrapeQueued?: boolean;
  quotaExceeded?: boolean;
  isFirstTimeSetup?: boolean;
  quota?: QuotaInfo;
};

const RADIUS_OPTIONS = [5, 10, 20, 50, 75] as const;

const DAILY_WARN_REMAINING = 1;
const MONTHLY_WARN_REMAINING = 3;

function loadGoogleMaps(browserKey: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).google?.maps?.places) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps")),
      );
      return;
    }

    const script = document.createElement("script");
    script.dataset.googleMaps = "1";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      browserKey,
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

export default function LeadsSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();

  const [city, setCity] = useState(initial.primaryCity);
  const [state, setState] = useState(initial.primaryState);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

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

  const [autocompleteReady, setAutocompleteReady] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(
    null,
  );

  const [warningOpen, setWarningOpen] = useState(false);
  const [warningQuota, setWarningQuota] = useState<QuotaInfo | null>(null);

  const cityInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const browserKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!browserKey) {
      setAutocompleteError(
        "City autocomplete is unavailable — Google Maps key not configured.",
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadGoogleMaps(browserKey);
        if (cancelled) return;
        if (!cityInputRef.current) return;
        if (autocompleteRef.current) return;

        const google = (window as any).google;
        const ac = new google.maps.places.Autocomplete(cityInputRef.current, {
          types: ["(cities)"],
          componentRestrictions: { country: "us" },
          fields: ["address_components", "geometry", "name"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const components: any[] = place.address_components ?? [];

          const cityComp =
            components.find((c) => c.types.includes("locality")) ??
            components.find((c) => c.types.includes("postal_town")) ??
            components.find((c) =>
              c.types.includes("administrative_area_level_3"),
            );
          const stateComp = components.find((c) =>
            c.types.includes("administrative_area_level_1"),
          );

          const nextCity = cityComp?.long_name ?? place.name ?? "";
          const nextState = stateComp?.short_name ?? "";

          const location = place.geometry?.location;
          const nextLat =
            typeof location?.lat === "function" ? location.lat() : null;
          const nextLng =
            typeof location?.lng === "function" ? location.lng() : null;

          setCity(nextCity);
          setState(nextState);
          setLat(nextLat);
          setLng(nextLng);

          if (cityInputRef.current) {
            cityInputRef.current.value = formatCityDisplay(nextCity, nextState);
          }
          setError(null);
          setSuccessMessage(null);
        });

        autocompleteRef.current = ac;
        setAutocompleteReady(true);
      } catch (err) {
        if (cancelled) return;
        setAutocompleteError(
          err instanceof Error ? err.message : "Failed to load autocomplete",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
          primaryLat: lat,
          primaryLng: lng,
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

      // First-time setup: route them through the welcome page so the
      // unavoidable scrape wait is filled with useful tutorial content.
      // The welcome page polls the scrape status and auto-advances them
      // to /dashboard/leads/search when it completes.
      if (data.isFirstTimeSetup) {
        router.push("/dashboard/leads/welcome");
        return;
      }

      if (data.quotaExceeded) {
        setSuccessMessage(
          "Settings saved, but you've reached your market scrape limit. Leads for this market will refresh when your quota resets.",
        );
      } else if (data.scrapeQueued) {
        setSuccessMessage(
          "Settings saved. Your market is being prepared — warm leads will appear in a few minutes.",
        );
      } else {
        setSuccessMessage("Settings saved.");
      }

      if (data.quota) {
        const dailyRemaining = data.quota.dailyLimit - data.quota.dailyUsed;
        const monthlyRemaining =
          data.quota.monthlyLimit - data.quota.monthlyUsed;
        if (
          dailyRemaining <= DAILY_WARN_REMAINING ||
          monthlyRemaining <= MONTHLY_WARN_REMAINING
        ) {
          setWarningQuota(data.quota);
          setWarningOpen(true);
        }
      }

      router.refresh();
      window.dispatchEvent(new CustomEvent("leads:quota-changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function formatCityDisplay(c: string, s: string): string {
    if (c && s) return `${c}, ${s}, USA`;
    return c;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor='city' className={styles.label}>
            Primary city
          </label>
          <input
            id='city'
            ref={cityInputRef}
            type='text'
            defaultValue={formatCityDisplay(
              initial.primaryCity,
              initial.primaryState,
            )}
            onChange={(e) => {
              setCity(e.target.value);
              setState("");
              setLat(null);
              setLng(null);
            }}
            placeholder='Start typing a city...'
            autoComplete='off'
            required
            className={styles.input}
          />
          {state ? (
            <span className={styles.fieldHint}>
              State: <strong>{state}</strong>
            </span>
          ) : autocompleteError ? (
            <span className={styles.fieldHint}>
              {autocompleteError} Type your city — we&apos;ll resolve it on
              save.
            </span>
          ) : autocompleteReady ? (
            <span className={styles.fieldHint}>
              Pick a suggestion to set the state automatically.
            </span>
          ) : (
            <span className={styles.fieldHint}>Loading city suggestions…</span>
          )}
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

      {warningQuota && (
        <QuotaWarningModal
          isOpen={warningOpen}
          onClose={() => setWarningOpen(false)}
          dailyUsed={warningQuota.dailyUsed}
          dailyLimit={warningQuota.dailyLimit}
          monthlyUsed={warningQuota.monthlyUsed}
          monthlyLimit={warningQuota.monthlyLimit}
        />
      )}
    </>
  );
}
