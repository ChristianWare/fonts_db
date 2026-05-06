"use client";

import { useState } from "react";
import styles from "./SearchPage.module.css";

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
  alreadySaved: boolean;
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
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [radius, setRadius] = useState(defaultRadius);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

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
          radiusMilesOverride: radius !== defaultRadius ? radius : undefined,
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

      const fetched = data.results ?? [];
      setResults(fetched);
      setSavedIds(
        new Set(fetched.filter((r) => r.alreadySaved).map((r) => r.placeId)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(result: SearchResult) {
    setSavedIds((prev) => new Set(prev).add(result.placeId));

    try {
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
        }),
      });

      if (!res.ok && res.status !== 409) {
        throw new Error("Save failed");
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(result.placeId);
        return next;
      });
    }
  }

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
              const saved = savedIds.has(r.placeId);
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
                    <button
                      type='button'
                      onClick={() => handleSave(r)}
                      disabled={saved}
                      className={saved ? styles.savedBtn : styles.saveBtn}
                    >
                      {saved ? "Saved ✓" : "+ Save to pipeline"}
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