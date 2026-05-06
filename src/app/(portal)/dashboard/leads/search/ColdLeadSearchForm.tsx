"use client";

import { useState, useEffect, useRef } from "react";
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

const STORAGE_KEY = "coldLeadSearch:state:v2";

type StoredState = {
  query: string;
  city: string;
  state: string;
  radius: number;
  searchedQuery: string;
  currentPage: number;
  pagesData: Record<number, SearchResult[]>;
  pageTokens: Record<number, string | null>;
  totalKnown: boolean;
};

function loadStored(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function saveStored(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("sessionStorage write failed", err);
  }
}

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
  const [searchedQuery, setSearchedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesData, setPagesData] = useState<Record<number, SearchResult[]>>(
    {},
  );
  const [pageTokens, setPageTokens] = useState<Record<number, string | null>>(
    {},
  );
  const [totalKnown, setTotalKnown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlaceIds, setPendingPlaceIds] = useState<Set<string>>(
    new Set(),
  );

  const hydrated = useRef(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const stored = loadStored();
    if (stored && stored.searchedQuery) {
      setQuery(stored.query);
      setCity(stored.city);
      setState(stored.state);
      setRadius(stored.radius);
      setSearchedQuery(stored.searchedQuery);
      setCurrentPage(stored.currentPage);
      setPagesData(stored.pagesData ?? {});
      setPageTokens(stored.pageTokens ?? {});
      setTotalKnown(stored.totalKnown ?? false);
    }
    hydrated.current = true;
  }, []);

  // Persist to sessionStorage on state changes (after hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    if (!searchedQuery) return;
    saveStored({
      query,
      city,
      state,
      radius,
      searchedQuery,
      currentPage,
      pagesData,
      pageTokens,
      totalKnown,
    });
  }, [
    query,
    city,
    state,
    radius,
    searchedQuery,
    currentPage,
    pagesData,
    pageTokens,
    totalKnown,
  ]);

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
    setPagesData((prev) => {
      const next: Record<number, SearchResult[]> = {};
      for (const key of Object.keys(prev)) {
        const pageNum = Number(key);
        next[pageNum] = prev[pageNum].map((r) =>
          r.placeId === placeId ? { ...r, savedState, savedLeadId } : r,
        );
      }
      return next;
    });
  }

  async function executeSearch(pageNum: number, pageToken?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          cityOverride:
            city.trim() !== defaultCity ? city.trim() : undefined,
          stateOverride:
            state.trim() !== defaultState
              ? state.trim().toUpperCase()
              : undefined,
          radiusMilesOverride:
            radius !== defaultRadius ? radius : undefined,
          pageToken,
        }),
      });

      const text = await res.text();
      let data: {
        results?: SearchResult[];
        error?: string;
        nextPageToken?: string | null;
      } = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }

      setPagesData((prev) => ({ ...prev, [pageNum]: data.results ?? [] }));
      setPageTokens((prev) => ({
        ...prev,
        [pageNum]: data.nextPageToken ?? null,
      }));

      if (!data.nextPageToken) {
        setTotalKnown(true);
      }

      setCurrentPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setPagesData({});
    setPageTokens({});
    setCurrentPage(1);
    setTotalKnown(false);
    setSearchedQuery(query.trim());
    executeSearch(1);
  }

  function goToPrevPage() {
    if (currentPage <= 1) return;
    if (pagesData[currentPage - 1]) {
      setCurrentPage(currentPage - 1);
    }
  }

  function goToNextPage() {
    const nextPageNum = currentPage + 1;
    if (pagesData[nextPageNum]) {
      setCurrentPage(nextPageNum);
      return;
    }
    const token = pageTokens[currentPage];
    if (token) {
      executeSearch(nextPageNum, token);
    }
  }

  async function toggleFavorite(result: SearchResult) {
    setPending(result.placeId, true);
    try {
      if (result.savedState === "favorite" && result.savedLeadId) {
        const res = await fetch(`/api/leads/${result.savedLeadId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          updateResultState(result.placeId, "none", null);
        }
      } else if (result.savedState === "none") {
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
        const res = await fetch(`/api/leads/${result.savedLeadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFavorite: false }),
        });
        if (res.ok) {
          updateResultState(result.placeId, "pipeline", result.savedLeadId);
        }
      } else if (result.savedState === "none") {
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

  function viewDetails(result: SearchResult) {
    // Cache lookup data for the preview page — no DB write here
    try {
      sessionStorage.setItem(
        `preview:${result.placeId}`,
        JSON.stringify({
          placeId: result.placeId,
          name: result.name,
          address: result.address,
          coordinates: result.coordinates,
          rating: result.rating,
          reviewCount: result.reviewCount,
          phone: result.phone,
          website: result.website,
          types: result.types,
          category: searchedQuery.toLowerCase().replace(/\s+/g, "_"),
          savedState: result.savedState,
          savedLeadId: result.savedLeadId,
        }),
      );
    } catch (err) {
      console.error("Failed to cache preview data", err);
    }
    router.push(
      `/dashboard/leads/preview/${encodeURIComponent(result.placeId)}`,
    );
  }

  const currentResults = pagesData[currentPage] ?? [];
  const hasNextPage = !!pageTokens[currentPage];
  const knownTotalPages = totalKnown
    ? Math.max(...Object.keys(pagesData).map(Number), 1)
    : null;

  return (
    <div className={styles.body}>
      <form onSubmit={handleSearch} className={styles.searchCard}>
        <div className={styles.field}>
          <label htmlFor='category' className={styles.label}>
            Category
          </label>
          <select
            id='category'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.select}
          >
            <option value=''>Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor='city' className={styles.label}>
              City
            </label>
            <input
              id='city'
              type='text'
              value={city}
              onChange={(e) => setCity(e.target.value)}
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
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor='radius' className={styles.label}>
              Radius (miles)
            </label>
            <input
              id='radius'
              type='number'
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10) || 50)}
              min={10}
              max={150}
              className={styles.input}
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={loading || !query.trim()}
          className={styles.searchBtn}
        >
          {loading && currentPage === 1 ? "Searching..." : "Search"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {currentResults.length > 0 && (
        <div className={styles.resultsWrap}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount}>
              Page {currentPage}
              {knownTotalPages ? ` of ${knownTotalPages}` : ""} —{" "}
              {currentResults.length} result
              {currentResults.length === 1 ? "" : "s"} for &ldquo;
              {searchedQuery}&rdquo;
            </p>
          </div>

          <div className={styles.resultsGrid}>
            {currentResults.map((r) => {
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
                          target='_blank'
                          rel='noopener noreferrer'
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
                        type='button'
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
                          type='button'
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
                      type='button'
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

          <div className={styles.paginationBar}>
            <button
              type='button'
              onClick={goToPrevPage}
              disabled={currentPage <= 1 || loading}
              className={styles.pagerBtn}
            >
              ← Previous
            </button>
            <span className={styles.pagerLabel}>
              Page {currentPage}
              {knownTotalPages ? ` of ${knownTotalPages}` : ""}
            </span>
            <button
              type='button'
              onClick={goToNextPage}
              disabled={!hasNextPage || loading}
              className={styles.pagerBtn}
            >
              {loading && currentPage > 1 ? "Loading..." : "Next →"}
            </button>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        currentResults.length === 0 &&
        searchedQuery && (
          <p className={styles.emptyState}>
            No results for &ldquo;{searchedQuery}&rdquo;. Try a different
            category or expand your radius.
          </p>
        )}
    </div>
  );
}