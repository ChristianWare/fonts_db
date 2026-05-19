/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
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

// Lazy-load the Google Maps JS API once. Subsequent calls reuse the
// in-flight or already-loaded script tag — safe to call from multiple
// components on the same page.
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

  // Existing users may have a radius outside the new fixed list — normalize.
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

  const cityInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  // Attach Google Places autocomplete to the city input
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
        if (autocompleteRef.current) return; // already attached

        const google = (window as any).google;
        const ac = new google.maps.places.Autocomplete(cityInputRef.current, {
          types: ["(cities)"],
          componentRestrictions: { country: "us" },
          fields: ["address_components", "geometry", "name"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const components: any[] = place.address_components ?? [];

          // "locality" is the standard US city. Fall back through a couple of
          // less common types for towns / unincorporated areas.
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

          setCity(nextCity);
          setState(nextState);
          // Google's widget writes the full "Phoenix, AZ, USA" string into
          // the input — rewrite it to just the city for a clean display.
          if (cityInputRef.current) cityInputRef.current.value = nextCity;
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
      <div className={styles.field}>
        <label htmlFor='city' className={styles.label}>
          Primary city
        </label>
        <input
          id='city'
          ref={cityInputRef}
          type='text'
          defaultValue={city}
          onChange={(e) => {
            // Manual typing — clear the previously-resolved state so we
            // don't save a stale "Atlanta with state=AZ" mismatch. The
            // place_changed handler will repopulate it when the user picks
            // a suggestion, or the server will geocode on save.
            setCity(e.target.value);
            setState("");
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
            {autocompleteError} Type your city — we&apos;ll resolve it on save.
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
  );
}
