"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./PreviewPage.module.css";

type SavedState = "none" | "favorite" | "pipeline";

type PreviewData = {
  placeId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  types: string[];
  hours?: string[] | null;
  priceLevel?: string | null;
  businessStatus?: string | null;
  category?: string;
  savedState?: SavedState;
  savedLeadId?: string | null;
};

type Props = {
  placeId: string;
  primaryLat: number | null;
  primaryLng: number | null;
  primaryCity: string | null;
  primaryState: string | null;
  serviceRadiusMiles: number | null;
};

const EARTH_RADIUS_MILES = 3958.8;

function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

function formatPriceLevel(level: string | null | undefined): string | null {
  if (!level) return null;
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return map[level] ?? null;
}

export default function PreviewClient({
  placeId,
  primaryLat,
  primaryLng,
  primaryCity,
  primaryState,
  serviceRadiusMiles,
}: Props) {

  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<
    null | "favorite" | "pipeline"
  >(null);
  const [savedAs, setSavedAs] = useState<"favorite" | "pipeline" | null>(null);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Try sessionStorage first (set by search page on click)
      try {
        const cached = sessionStorage.getItem(`preview:${placeId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as PreviewData;
          setData(parsed);
          if (parsed.savedState === "favorite" && parsed.savedLeadId) {
            setSavedAs("favorite");
            setSavedLeadId(parsed.savedLeadId);
          } else if (parsed.savedState === "pipeline" && parsed.savedLeadId) {
            setSavedAs("pipeline");
            setSavedLeadId(parsed.savedLeadId);
          }
          setLoading(false);
          return;
        }
      } catch {
        // ignore — fall through to API
      }

      // Fallback: fetch live from Google Place Details
      try {
        const res = await fetch(
          `/api/leads/place-details/${encodeURIComponent(placeId)}`,
        );
        if (!res.ok) {
          throw new Error("Couldn't load business details");
        }
        const fetched = (await res.json()) as PreviewData;
        setData(fetched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [placeId]);

  async function save(intent: "favorite" | "pipeline") {
    if (!data) return;
    setSavingState(intent);
    try {
      const res = await fetch("/api/leads/save-cold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: data.placeId,
          name: data.name,
          address: data.address,
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
          rating: data.rating,
          reviewCount: data.reviewCount,
          phone: data.phone,
          website: data.website,
          category: data.category ?? "uncategorized",
          isFavorite: intent === "favorite",
        }),
      });
      const body = await res.json();
      if (res.ok && body.id) {
        setSavedAs(intent);
        setSavedLeadId(body.id);
        // Update the cached preview data so going back to search reflects it
        try {
          sessionStorage.setItem(
            `preview:${placeId}`,
            JSON.stringify({
              ...data,
              savedState: intent,
              savedLeadId: body.id,
            }),
          );
        } catch {
          // ignore
        }
      } else if (res.status === 409 && body.id) {
        // Already saved — recover the id and show as such
        setSavedAs(intent);
        setSavedLeadId(body.id);
      } else {
        console.error("Save failed", body);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSavingState(null);
    }
  }

  const distance =
    data &&
    primaryLat != null &&
    primaryLng != null &&
    data.coordinates.lat &&
    data.coordinates.lng
      ? distanceMiles(
          primaryLat,
          primaryLng,
          data.coordinates.lat,
          data.coordinates.lng,
        )
      : null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link href='/dashboard/leads/search' className={styles.backLink}>
            ← Back to search
          </Link>
        </div>
        <div className={styles.loadingState}>Loading details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link href='/dashboard/leads/search' className={styles.backLink}>
            ← Back to search
          </Link>
        </div>
        <div className={styles.errorState}>
          <p>{error ?? "No data available."}</p>
          <Link href='/dashboard/leads/search' className={styles.errorCta}>
            Return to search →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href='/dashboard/leads/search' className={styles.backLink}>
          ← Back to search
        </Link>
      </div>

      <div className={styles.layout}>
        <div className={styles.body}>
          {savedAs && savedLeadId && (
            <div className={styles.savedBanner}>
              <span className={styles.savedBannerText}>
                {savedAs === "favorite"
                  ? "♥ Saved to favorites"
                  : "✓ Saved to pipeline"}
              </span>
              <Link
                href={`/dashboard/leads/${savedLeadId}`}
                className={styles.savedBannerLink}
              >
                Open full lead page →
              </Link>
            </div>
          )}

          <section className={styles.hero}>
            <p className={styles.eyebrow}>Preview · not yet saved</p>
            <h1 className={styles.heroName}>{data.name || "Unnamed"}</h1>
            {data.address && (
              <p className={styles.heroAddress}>{data.address}</p>
            )}

            <div className={styles.heroDetails}>
              {data.rating !== null && (
                <span className={styles.heroRating}>
                  ★ {data.rating.toFixed(1)} ({data.reviewCount ?? 0} reviews)
                </span>
              )}
              {formatPriceLevel(data.priceLevel) && (
                <span className={styles.heroDetail}>
                  {formatPriceLevel(data.priceLevel)}
                </span>
              )}
              {data.businessStatus && data.businessStatus !== "OPERATIONAL" && (
                <span className={styles.heroStatusWarn}>
                  {data.businessStatus.replace(/_/g, " ")}
                </span>
              )}
            </div>

            <div className={styles.heroLinks}>
              {data.phone && (
                <a href={`tel:${data.phone}`} className={styles.heroLink}>
                  {data.phone}
                </a>
              )}
              {data.website && (
                <a
                  href={data.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.heroLink}
                >
                  {data.website.replace(/^https?:\/\//, "")} ↗
                </a>
              )}
            </div>
          </section>

          {distance !== null && primaryCity && (
            <section className={styles.distanceCard}>
              <p className={styles.distanceValue}>
                {distance.toFixed(1)} miles
              </p>
              <p className={styles.distanceDesc}>
                from your base in {primaryCity}, {primaryState}
                {serviceRadiusMiles && distance > serviceRadiusMiles
                  ? ` — outside your ${serviceRadiusMiles}-mile service radius`
                  : serviceRadiusMiles
                    ? ` — within your ${serviceRadiusMiles}-mile service radius`
                    : ""}
              </p>
            </section>
          )}

          {data.types.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Categories</h2>
              <div className={styles.typesList}>
                {data.types.map((t) => (
                  <span key={t} className={styles.typeChip}>
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.hours && data.hours.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Hours</h2>
              <ul className={styles.hoursList}>
                {data.hours.map((h, i) => (
                  <li key={i} className={styles.hoursItem}>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.aiTease}>
            <p className={styles.aiTeaseTitle}>
              Want the strategic brief, review intelligence, and outreach
              scripts?
            </p>
            <p className={styles.aiTeaseDesc}>
              Save this lead — to favorites for further research, or directly to
              your pipeline — and you&apos;ll get the full AI-powered detail
              page with brief generation, review analysis, decision-maker
              identification, and personalized outreach scripts.
            </p>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            <h3 className={styles.sidebarTitle}>Save this lead</h3>

            {savedAs === "favorite" ? (
              <div className={styles.savedNotice}>
                <p>♥ Already in your favorites</p>
                <Link
                  href={`/dashboard/leads/${savedLeadId}`}
                  className={styles.sidebarBtnPrimary}
                >
                  Open full page →
                </Link>
                <button
                  type='button'
                  onClick={() => save("pipeline")}
                  disabled={savingState !== null}
                  className={styles.sidebarBtn}
                >
                  {savingState === "pipeline"
                    ? "Promoting..."
                    : "Promote to pipeline"}
                </button>
              </div>
            ) : savedAs === "pipeline" ? (
              <div className={styles.savedNotice}>
                <p>✓ Already in your pipeline</p>
                <Link
                  href={`/dashboard/leads/${savedLeadId}`}
                  className={styles.sidebarBtnPrimary}
                >
                  Open full page →
                </Link>
              </div>
            ) : (
              <>
                <button
                  type='button'
                  onClick={() => save("favorite")}
                  disabled={savingState !== null}
                  className={styles.sidebarBtnFavorite}
                >
                  {savingState === "favorite"
                    ? "Saving..."
                    : "♡ Save to favorites"}
                </button>

                <button
                  type='button'
                  onClick={() => save("pipeline")}
                  disabled={savingState !== null}
                  className={styles.sidebarBtnPrimary}
                >
                  {savingState === "pipeline"
                    ? "Saving..."
                    : "+ Save to pipeline"}
                </button>

                <p className={styles.sidebarHint}>
                  Favorites = bookmarks for later research. Pipeline = leads
                  you&apos;re actively pursuing.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
