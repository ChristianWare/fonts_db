"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchPage.module.css";

type SavedState = "none" | "favorite" | "pipeline";

type SearchResult = {
  placeId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  types: string[];
  savedState: SavedState;
  savedLeadId: string | null;
};

type Props = {
  defaultCity: string;
  defaultState: string;
  defaultRadius: number;
};

const CATEGORIES = [
  "wedding venues",
  "hotels",
  "law firms",
  "country clubs",
  "funeral homes",
  "resort spas",
  "event venues",
  "corporate offices",
];

export default function ColdLeadSearchForm({
  defaultCity,
  defaultState,
  defaultRadius,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [radius, setRadius] = useState(defaultRadius);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [pendingPlaceIds, setPendingPlaceIds] = useState<Set<string>>(
    new Set(),
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchedQuery(query.trim());

    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          cityOverride: city.trim() !== defaultCity ? city.trim() : undefined,
          stateOverride:
            state.trim() !== defaultState
              ? state.trim().toUpperCase()
              : undefined,
          radiusMilesOverride:
            radius !== defaultRadius ? radius : undefined,
        }),
      });

      const text = await res.text();
      let data: { results?: SearchResult[]; error?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }

      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function setPending(placeId: string, pending: boolean) {
    setPendingPlaceIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(placeId);
      else next.delete(placeId);
      return next;
    });
  }

  function updateResultState(
    placeId: string,
    savedState: SavedState,
    savedLeadId: string | null,
  ) {
    setResults((prev) =>
      prev.map((r) =>
        r.placeId === placeId ? { ...r, savedState, savedLeadId } : r,
      ),
    );
  }

  async function toggleFavorite(result: SearchResult) {
    setPending(result.placeId, true);
    try {
      if (result.savedState === "favorite" && result.savedLeadId) {
        // Un-favorite: delete the lead
        const res = await fetch(`/api/leads/${result.savedLeadId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          updateResultState(result.placeId, "none", null);
        }
      } else if (result.savedState === "none") {
        // Favorite: create lead with isFavorite=true
        const res = await fetch("/api/leads/save-cold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placeId: result.placeId,
            name: result.name,
            address: result.address,
            lat: result.coordinates.lat,
            lng: result.coordinates.lng,
            rating: result.rating,
            reviewCount: result.reviewCount,
            phone: result.phone,
            website: result.website,
            category: searchedQuery.toLowerCase().replace(/\s+/g, "_"),
            isFavorite: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          updateResultState(result.placeId, "favorite", data.id);
        }
      }
    } catch (err) {
      console.error("Favorite toggle failed", err);
    } finally {
      setPending(result.placeId, false);
    }
  }

  async function saveToPipeline(result: SearchResult) {
    setPending(result.placeId, true);
    try {
      if (result.savedState === "favorite" && result.savedLeadId) {
        // Promote favorite to pipeline
        const res = await fetch(`/api/leads/${result.savedLeadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFavorite: false }),
        });
        if (res.ok) {
          updateResultState(result.placeId, "pipeline", result.savedLeadId);
        }
      } else if (result.savedState === "none") {
        // Save directly to pipeline
        const res = await fetch("/api/leads/save-cold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placeId: result.placeId,
            name: result.name,
            address: result.address,
            lat: result.coordinates.lat,
            lng: result.coordinates.lng,
            rating: result.rating,
            reviewCount: result.reviewCount,
            phone: result.phone,
            website: result.website,
            category: searchedQuery.toLowerCase().replace(/\s+/g, "_"),
            isFavorite: false,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          updateResultState(result.placeId, "pipeline", data.id);
        }
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setPending(result.placeId, false);
    }
  }

  async function viewDetails(result: SearchResult) {
    setPending(result.placeId, true);
    try {
      let leadId = result.savedLeadId;

      // If not yet saved, save as favorite first
      if (result.savedState === "none") {
        const res = await fetch("/api/leads/save-cold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placeId: result.placeId,
            name: result.name,
            address: result.address,
            lat: result.coordinates.lat,
            lng: result.coordinates.lng,
            rating: result.rating,
            reviewCount: result.reviewCount,
            phone: result.phone,
            website: result.website,
            category: searchedQuery.toLowerCase().replace(/\s+/g, "_"),
            isFavorite: true,
          }),
        });
        if (!res.ok) {
          console.error("Save-on-view failed", await res.text());
          return;
        }
        const data = await res.json();
        leadId = data.id;
      }

      if (leadId) {
        router.push(`/dashboard/leads/${leadId}`);
      }
    } catch (err) {
      console.error("View details failed", err);
    } finally {
      setPending(result.placeId, false);
    }
  }

  return (
    <div className={styles.body}>
      <form onSubmit={handleSearch} className={styles.searchCard}>
        <div className={styles.field}>
          <label htmlFor="category" className={styles.label}>
            Category
          </label>
          <select
            id="category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.select}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="city" className={styles.label}>
              City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="state" className={styles.label}>
              State
            </label>
            <input
              id="state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              maxLength={2}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="radius" className={styles.label}>
              Radius (miles)
            </label>
            <input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10) || 50)}
              min={10}
              max={150}
              className={styles.input}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={styles.searchBtn}
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {results.length > 0 && (
        <div className={styles.resultsWrap}>
          <p className={styles.resultsCount}>
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;
            {searchedQuery}&rdquo;
          </p>
          <div className={styles.resultsGrid}>
            {results.map((r) => {
              const isPending = pendingPlaceIds.has(r.placeId);
              return (
                <div key={r.placeId} className={styles.resultCard}>
                  <div className={styles.cardTop}>
                    <h3 className={styles.resultName}>{r.name}</h3>
                    <p className={styles.resultAddress}>{r.address}</p>

                    {r.rating !== null && (
                      <p className={styles.resultRating}>
                        ★ {r.rating.toFixed(1)}{" "}
                        <span className={styles.resultReviewCount}>
                          ({r.reviewCount ?? 0} reviews)
                        </span>
                      </p>
                    )}

                    <div className={styles.resultMeta}>
                      {r.phone && <span>{r.phone}</span>}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.resultLink}
                        >
                          Visit website ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.cardActionRow}>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(r)}
                        disabled={isPending || r.savedState === "pipeline"}
                        className={
                          r.savedState === "favorite"
                            ? `${styles.heartBtn} ${styles.heartBtnActive}`
                            : styles.heartBtn
                        }
                        aria-label={
                          r.savedState === "favorite"
                            ? "Remove favorite"
                            : "Add to favorites"
                        }
                        title={
                          r.savedState === "pipeline"
                            ? "Already in pipeline"
                            : r.savedState === "favorite"
                              ? "Remove favorite"
                              : "Add to favorites"
                        }
                      >
                        {r.savedState === "favorite" ? "♥" : "♡"}
                      </button>

                      {r.savedState === "pipeline" ? (
                        <span className={styles.savedBadge}>
                          ✓ In pipeline
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => saveToPipeline(r)}
                          disabled={isPending}
                          className={styles.saveBtn}
                        >
                          {r.savedState === "favorite"
                            ? "+ Promote to pipeline"
                            : "+ Save to pipeline"}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => viewDetails(r)}
                      disabled={isPending}
                      className={styles.detailsBtn}
                    >
                      {isPending ? "Loading..." : "View details →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && results.length === 0 && searchedQuery && (
        <p className={styles.emptyState}>
          No results for &ldquo;{searchedQuery}&rdquo;. Try a different category
          or expand your radius.
        </p>
      )}
    </div>
  );
}