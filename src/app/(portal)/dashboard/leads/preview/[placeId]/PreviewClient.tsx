"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./PreviewPage.module.css";

type SavedState = "none" | "favorite" | "pipeline";

type ParkingOptions = {
  freeParkingLot?: boolean;
  paidParkingLot?: boolean;
  freeStreetParking?: boolean;
  paidStreetParking?: boolean;
  valetParking?: boolean;
  freeGarageParking?: boolean;
  paidGarageParking?: boolean;
};

type Photo = { name: string; widthPx: number; heightPx: number };

type PriceAmount = { amount: number; currency: string };
type PriceRange = {
  startPrice: PriceAmount | null;
  endPrice: PriceAmount | null;
};

type Review = {
  name: string;
  rating: number;
  text: string | null;
  relativeTime: string | null;
  publishTime: string | null;
  authorName: string | null;
  authorPhotoUri: string | null;
};

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
  openNow?: boolean | null;
  priceLevel?: string | null;
  priceRange?: PriceRange | null;
  businessStatus?: string | null;
  editorialSummary?: string | null;
  photos?: Photo[] | null;
  parkingOptions?: ParkingOptions | null;
  reservable?: boolean | null;
  goodForGroups?: boolean | null;
  outdoorSeating?: boolean | null;
  liveMusic?: boolean | null;
  allowsDogs?: boolean | null;
  goodForChildren?: boolean | null;
  servesCocktails?: boolean | null;
  servesWine?: boolean | null;
  servesBeer?: boolean | null;
  servesBreakfast?: boolean | null;
  servesBrunch?: boolean | null;
  servesLunch?: boolean | null;
  servesDinner?: boolean | null;
  takeout?: boolean | null;
  delivery?: boolean | null;
  dineIn?: boolean | null;
  curbsidePickup?: boolean | null;
  reviews?: Review[] | null;
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

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

function formatPriceRange(range: PriceRange | null | undefined): string | null {
  if (!range) return null;
  const { startPrice, endPrice } = range;
  if (!startPrice && !endPrice) return null;
  const symbol = (currency: string) =>
    currency === "USD" ? "$" : `${currency} `;
  if (startPrice && endPrice) {
    return `${symbol(startPrice.currency)}${startPrice.amount}–${symbol(endPrice.currency)}${endPrice.amount}`;
  }
  if (startPrice) return `from ${symbol(startPrice.currency)}${startPrice.amount}`;
  if (endPrice) return `up to ${symbol(endPrice.currency)}${endPrice.amount}`;
  return null;
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

function formatDriveTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function buildAtmosphereChips(data: PreviewData): string[] {
  const chips: string[] = [];
  if (data.reservable === true) chips.push("Reservable");
  if (data.goodForGroups === true) chips.push("Good for groups");
  if (data.liveMusic === true) chips.push("Live music");
  if (data.outdoorSeating === true) chips.push("Outdoor seating");
  if (data.goodForChildren === true) chips.push("Family friendly");
  if (data.allowsDogs === true) chips.push("Dog friendly");
  if (data.servesCocktails === true) chips.push("Cocktails");
  if (data.servesWine === true) chips.push("Wine");
  if (data.servesBeer === true) chips.push("Beer");
  if (data.dineIn === true) chips.push("Dine-in");
  if (data.takeout === true) chips.push("Takeout");
  if (data.delivery === true) chips.push("Delivery");
  if (data.curbsidePickup === true) chips.push("Curbside pickup");
  return chips;
}

function buildParkingChips(
  options: ParkingOptions | null | undefined,
): string[] {
  if (!options) return [];
  const chips: string[] = [];
  if (options.valetParking) chips.push("Valet parking");
  if (options.freeParkingLot) chips.push("Free lot");
  if (options.paidParkingLot) chips.push("Paid lot");
  if (options.freeGarageParking) chips.push("Free garage");
  if (options.paidGarageParking) chips.push("Paid garage");
  if (options.freeStreetParking) chips.push("Free street parking");
  if (options.paidStreetParking) chips.push("Paid street parking");
  return chips;
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className={styles.starsEmpty}>{"★".repeat(5 - filled)}</span>
    </span>
  );
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
  const [mapFailed, setMapFailed] = useState(false);
  const [driveTime, setDriveTime] = useState<{
    seconds: number;
    staticSeconds: number | null;
  } | null>(null);
  const [savingState, setSavingState] = useState<
    null | "favorite" | "pipeline"
  >(null);
  const [savedAs, setSavedAs] = useState<"favorite" | "pipeline" | null>(null);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;

  async function loadDriveTime(toLat: number, toLng: number) {
    if (primaryLat == null || primaryLng == null) return;
    try {
      const res = await fetch(
        `/api/leads/drive-time?fromLat=${primaryLat}&fromLng=${primaryLng}&toLat=${toLat}&toLng=${toLng}`,
      );
      if (!res.ok) {
        const body = await res.text();
        console.warn("[preview] drive-time failed:", res.status, body);
        return;
      }
      const body = await res.json();
      if (!cancelled && body.driveTimeSeconds) {
        setDriveTime({
          seconds: body.driveTimeSeconds,
          staticSeconds: body.driveTimeStaticSeconds ?? null,
        });
      }
    } catch (err) {
      console.warn("[preview] drive-time threw:", err);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);

    let cachedData: PreviewData | null = null;
    try {
      const cached = sessionStorage.getItem(`preview:${placeId}`);
      if (cached) {
        cachedData = JSON.parse(cached) as PreviewData;
        if (!cancelled) {
          setData(cachedData);
          if (cachedData.savedState === "favorite" && cachedData.savedLeadId) {
            setSavedAs("favorite");
            setSavedLeadId(cachedData.savedLeadId);
          } else if (
            cachedData.savedState === "pipeline" &&
            cachedData.savedLeadId
          ) {
            setSavedAs("pipeline");
            setSavedLeadId(cachedData.savedLeadId);
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch(
        `/api/leads/place-details/${encodeURIComponent(placeId)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[preview] place-details failed:", res.status, body);
        throw new Error(
          body.googleError
            ? `Google API error (${body.googleStatus}): ${body.googleError}`
            : "Couldn't load business details",
        );
      }
      const fetched = (await res.json()) as PreviewData;
      console.log("[preview] place-details fetched:", {
        hasPhotos: !!fetched.photos?.length,
        hasEditorial: !!fetched.editorialSummary,
        hasReviews: !!fetched.reviews?.length,
        hasParking: !!fetched.parkingOptions,
      });
      if (!cancelled) {
        setData((prev) => ({
          ...fetched,
          category: prev?.category ?? cachedData?.category,
          savedState: prev?.savedState ?? cachedData?.savedState,
          savedLeadId: prev?.savedLeadId ?? cachedData?.savedLeadId,
        }));
        if (fetched.coordinates.lat && fetched.coordinates.lng) {
          loadDriveTime(fetched.coordinates.lat, fetched.coordinates.lng);
        }
      }
    } catch (err) {
      console.error("[preview] details load error:", err);
      if (!cancelled && !cachedData) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  load();
  return () => {
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading && !data) {
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

  const todayName = DAY_NAMES[new Date().getDay()];
  const todayHoursIndex =
    data.hours?.findIndex((h) => h.startsWith(todayName)) ?? -1;
  const atmosphereChips = buildAtmosphereChips(data);
  const parkingChips = buildParkingChips(data.parkingOptions);
  const allChips = [...atmosphereChips, ...parkingChips];
  const priceDisplay =
    formatPriceRange(data.priceRange) ?? formatPriceLevel(data.priceLevel);
  const isEstablished =
    data.reviewCount !== null &&
    data.reviewCount !== undefined &&
    data.reviewCount >= 1000;
  const sortedReviews = data.reviews
    ? [...data.reviews].sort((a, b) =>
        (b.publishTime ?? "").localeCompare(a.publishTime ?? ""),
      )
    : null;
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(data.placeId)}`;

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

          {/* Hero */}
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
              {isEstablished && (
                <span className={styles.establishedBadge}>Established</span>
              )}
              {priceDisplay && (
                <span className={styles.heroDetail}>{priceDisplay}</span>
              )}
              {data.openNow === true && (
                <span className={styles.openBadge}>● Open now</span>
              )}
              {data.openNow === false && (
                <span className={styles.closedBadge}>● Closed</span>
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
              <a
                href={mapsUrl}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.heroLink}
              >
                Open in Google Maps ↗
              </a>
            </div>
          </section>

          {/* Photos */}
          {data.photos && data.photos.length > 0 && (
            <section className={styles.photosSection}>
              <div className={styles.photosRow}>
                {data.photos.slice(0, 6).map((photo, i) => (
                  <div key={photo.name} className={styles.photoWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/leads/place-photo?name=${encodeURIComponent(photo.name)}&maxWidth=600`}
                      alt={`${data.name} photo ${i + 1}`}
                      loading='lazy'
                      className={styles.photoThumb}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Location card with map + distance + drive time */}
          {distance !== null && primaryCity && data.coordinates.lat && (
            <section
              className={`${styles.locationCard} ${mapFailed ? styles.locationCardNoMap : ""}`}
            >
              {!mapFailed && (
                <div className={styles.locationMap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/leads/static-map?lat=${data.coordinates.lat}&lng=${data.coordinates.lng}&zoom=14&width=600&height=300`}
                    alt={`Map of ${data.name}`}
                    className={styles.mapImage}
                    onError={() => {
                      console.warn("[preview] static map failed to load");
                      setMapFailed(true);
                    }}
                  />
                </div>
              )}
              <div className={styles.locationStats}>
                <div className={styles.locationStatRow}>
                  <div className={styles.locationStat}>
                    <p className={styles.locationStatValue}>
                      {distance.toFixed(1)} mi
                    </p>
                    <p className={styles.locationStatLabel}>distance</p>
                  </div>
                  {driveTime ? (
                    <div className={styles.locationStat}>
                      <p className={styles.locationStatValue}>
                        {formatDriveTime(driveTime.seconds)}
                      </p>
                      <p className={styles.locationStatLabel}>
                        drive time
                        {driveTime.staticSeconds &&
                        driveTime.seconds > driveTime.staticSeconds * 1.15 ? (
                          <span className={styles.trafficNote}> (traffic)</span>
                        ) : null}
                      </p>
                    </div>
                  ) : null}
                </div>
                <p className={styles.locationDesc}>
                  from your base in {primaryCity}, {primaryState}
                  {serviceRadiusMiles && distance > serviceRadiusMiles
                    ? ` — outside your ${serviceRadiusMiles}-mile service radius`
                    : serviceRadiusMiles
                      ? ` — within your ${serviceRadiusMiles}-mile service radius`
                      : ""}
                </p>
              </div>
            </section>
          )}

          {/* Editorial Summary */}
          {data.editorialSummary && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About</h2>
              <p className={styles.editorialBody}>{data.editorialSummary}</p>
            </section>
          )}

          {/* At a glance — atmosphere + parking chips */}
          {allChips.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>At a glance</h2>
              <div className={styles.chipsRow}>
                {allChips.map((label) => (
                  <span key={label} className={styles.atmosphereChip}>
                    {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Hours */}
          {data.hours && data.hours.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Hours</h2>
              <ul className={styles.hoursList}>
                {data.hours.map((h, i) => (
                  <li
                    key={i}
                    className={
                      i === todayHoursIndex
                        ? styles.hoursItemToday
                        : styles.hoursItem
                    }
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recent reviews */}
          {sortedReviews && sortedReviews.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent reviews</h2>
              <div className={styles.reviewsList}>
                {sortedReviews.slice(0, 2).map((r) => (
                  <article key={r.name} className={styles.reviewCard}>
                    <header className={styles.reviewHeader}>
                      <span className={styles.reviewAuthor}>
                        {r.authorName ?? "Anonymous"}
                      </span>
                      <span className={styles.reviewMeta}>
                        <StarRating rating={r.rating} />
                        {r.relativeTime && (
                          <span className={styles.reviewTime}>
                            · {r.relativeTime}
                          </span>
                        )}
                      </span>
                    </header>
                    {r.text && <p className={styles.reviewText}>{r.text}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
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

          {/* AI tease */}
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

        {/* Sidebar */}
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