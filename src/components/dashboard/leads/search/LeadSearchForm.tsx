"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./SearchPage.module.css";
import rowStyles from "./cards/LeadRow.module.css";
import LeadRow from "./cards/LeadRow";
import type { Temperature, SavedState, SearchResult } from "./cards/types";

type SortOption = "distance" | "rating" | "reviews" | "name";

type Props = {
  defaultCity: string;
  defaultState: string;
  defaultRadius: number;
};

const RESULTS_PER_PAGE = 20;

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "wedding venues", label: "Wedding Venues" },
  { value: "hotels", label: "Hotels" },
  { value: "law firms", label: "Law Firms" },
  { value: "country clubs", label: "Country Clubs" },
  { value: "funeral homes", label: "Funeral Homes" },
  { value: "resort spas", label: "Resort Spas" },
  { value: "event venues", label: "Event Venues" },
  { value: "corporate offices", label: "Corporate Offices" },
];

const TEMPERATURES: Array<{
  value: Temperature;
  label: string;
  emoji: string;
  enabled: boolean;
}> = [
  { value: "hot", label: "Hot", emoji: "🔥", enabled: false },
  { value: "warm", label: "Warm", emoji: "🌡️", enabled: true },
  { value: "cold", label: "Cold", emoji: "🧊", enabled: true },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "reviews", label: "Reviews" },
  { value: "name", label: "Name (A–Z)" },
];

const STORAGE_KEY = "leadSearch:state:v4";

type StoredState = {
  selectedTemperatures: Temperature[];
  selectedCategories: string[];
  city: string;
  state: string;
  radius: number;
  sortBy: SortOption;
  freshOnly: boolean;
  searchedTemperatures: Temperature[];
  searchedCategories: string[];
  results: SearchResult[];
  currentPage: number;
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

function isSaved(state: SavedState): boolean {
  return state !== "none";
}

export default function LeadSearchForm({
  defaultCity,
  defaultState,
  defaultRadius,
}: Props) {
  // Filter state
  const [selectedTemperatures, setSelectedTemperatures] = useState<
    Temperature[]
  >(["cold"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [city, setCity] = useState(defaultCity);
  const [state, setState] = useState(defaultState);
  const [radius, setRadius] = useState(defaultRadius);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [freshOnly, setFreshOnly] = useState(false);

  // Search state
  const [searchedTemperatures, setSearchedTemperatures] = useState<
    Temperature[]
  >([]);
  const [searchedCategories, setSearchedCategories] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlaceIds, setPendingPlaceIds] = useState<Set<string>>(
    new Set(),
  );
  const [hasSearched, setHasSearched] = useState(false);

  const hydrated = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadStored();
    if (stored && stored.searchedCategories.length > 0) {
      setSelectedTemperatures(stored.selectedTemperatures);
      setSelectedCategories(stored.selectedCategories);
      setCity(stored.city);
      setState(stored.state);
      setRadius(stored.radius);
      setSortBy(stored.sortBy ?? "distance");
      setFreshOnly(stored.freshOnly ?? false);
      setSearchedTemperatures(stored.searchedTemperatures);
      setSearchedCategories(stored.searchedCategories);
      setResults(stored.results ?? []);
      setCurrentPage(stored.currentPage ?? 1);
      setHasSearched(true);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (searchedCategories.length === 0) return;
    saveStored({
      selectedTemperatures,
      selectedCategories,
      city,
      state,
      radius,
      sortBy,
      freshOnly,
      searchedTemperatures,
      searchedCategories,
      results,
      currentPage,
    });
  }, [
    selectedTemperatures,
    selectedCategories,
    city,
    state,
    radius,
    sortBy,
    freshOnly,
    searchedTemperatures,
    searchedCategories,
    results,
    currentPage,
  ]);

  // Auto-rerun search when sort or freshOnly change (after first search)
  useEffect(() => {
    if (!hydrated.current) return;
    if (!hasSearched) return;
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, freshOnly]);

  function toggleTemperature(t: Temperature) {
    const def = TEMPERATURES.find((x) => x.value === t);
    if (!def?.enabled) return;
    setSelectedTemperatures((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function selectAllCategories() {
    setSelectedCategories(CATEGORIES.map((c) => c.value));
  }

  function clearCategories() {
    setSelectedCategories([]);
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
      prev.map((r) => {
        if (r.temperature === "cold" && r.placeId === placeId) {
          return { ...r, savedState, savedLeadId };
        }
        return r;
      }),
    );
  }

  async function executeSearch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          temperatures: selectedTemperatures,
          cityOverride: city.trim() !== defaultCity ? city.trim() : undefined,
          stateOverride:
            state.trim() !== defaultState
              ? state.trim().toUpperCase()
              : undefined,
          radiusMilesOverride: radius !== defaultRadius ? radius : undefined,
          sortBy,
          freshOnly,
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
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (selectedTemperatures.length === 0) {
      setError("Pick at least one lead type.");
      return;
    }
    if (
      selectedTemperatures.includes("cold") &&
      selectedCategories.length === 0
    ) {
      setError("Pick at least one category for cold leads.");
      return;
    }

    setSearchedTemperatures([...selectedTemperatures]);
    setSearchedCategories([...selectedCategories]);
    setHasSearched(true);
    executeSearch();
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIdx = startIdx + RESULTS_PER_PAGE;
  const currentPageResults = useMemo(
    () => results.slice(startIdx, endIdx),
    [results, startIdx, endIdx],
  );

  function goToPage(p: number) {
    const target = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(target);
    if (typeof window !== "undefined") {
      tableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  async function saveLead(result: SearchResult) {
    if (result.temperature !== "cold") return;
    if (isSaved(result.savedState)) return;
    setPending(result.placeId, true);
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
          category: result.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateResultState(result.placeId, "saved", data.id);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setPending(result.placeId, false);
    }
  }

  const hasResults = results.length > 0;
 const canSearch =
   selectedTemperatures.length > 0 &&
   (!selectedTemperatures.includes("cold") || selectedCategories.length > 0);

  // Reusable pagination bar
  function PaginationBar() {
    if (totalPages <= 1) return null;
    return (
      <div className={styles.paginationBar}>
        <button
          type='button'
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className={styles.pagerBtn}
        >
          ← Previous
        </button>
        <select
          value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
          disabled={loading}
          className={styles.pagerSelect}
          aria-label='Jump to page'
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              Page {p} of {totalPages}
            </option>
          ))}
        </select>
        <button
          type='button'
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className={styles.pagerBtn}
        >
          Next →
        </button>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <form onSubmit={handleSearch} className={styles.searchCard}>
        {/* Lead Type / Temperature */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Lead Type</label>
            <span className={styles.helperText}>Pick one or more</span>
          </div>
          <div className={styles.pillRow}>
            {TEMPERATURES.map((t) => {
              const selected = selectedTemperatures.includes(t.value);
              return (
                <button
                  key={t.value}
                  type='button'
                  onClick={() => toggleTemperature(t.value)}
                  disabled={!t.enabled}
                  className={`${styles.pill} ${
                    selected ? styles.pillActive : ""
                  } ${!t.enabled ? styles.pillDisabled : ""}`}
                  title={!t.enabled ? "Coming soon" : undefined}
                >
                  <span className={styles.pillEmoji}>{t.emoji}</span>
                  {t.label}
                  {!t.enabled && <span className={styles.pillBadge}>Soon</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories — only relevant for cold leads */}
        {selectedTemperatures.includes("cold") && (
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Categories</label>
              <div className={styles.linkRow}>
                <button
                  type='button'
                  onClick={selectAllCategories}
                  className={styles.linkBtn}
                >
                  Select all
                </button>
                <span className={styles.linkSep}>·</span>
                <button
                  type='button'
                  onClick={clearCategories}
                  className={styles.linkBtn}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className={styles.pillRow}>
              {CATEGORIES.map((c) => {
                const selected = selectedCategories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type='button'
                    onClick={() => toggleCategory(c.value)}
                    className={`${styles.pill} ${
                      selected ? styles.pillActive : ""
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Location */}
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
              Radius (mi)
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

        {/* Submit */}
        <div className={styles.submitRow}>
          <button
            type='submit'
            disabled={loading || !canSearch}
            className={styles.searchBtn}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {/* Filters bar — only when there are results */}
      {hasResults && (
        <div className={styles.filtersBar}>
          <div className={styles.filtersBarLeft}>
            <span className={styles.filtersBarCount}>
              {results.length} result{results.length === 1 ? "" : "s"}
            </span>
            {totalPages > 1 && (
              <span className={styles.filtersBarPages}>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          <div className={styles.filtersBarRight}>
            <div className={styles.filterControl}>
              <label htmlFor='sortBy' className={styles.filterControlLabel}>
                Sort
              </label>
              <select
                id='sortBy'
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={styles.filterControlSelect}
                disabled={loading}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterControl}>
              <label className={styles.filterControlLabel}>Fresh only</label>
              <button
                type='button'
                onClick={() => setFreshOnly(!freshOnly)}
                disabled
                className={`${styles.filterControlToggle} ${
                  freshOnly ? styles.filterControlToggleOn : ""
                }`}
                title='Coming soon'
              >
                {freshOnly ? "On" : "Off"}{" "}
                <span className={styles.soonBadge}>Soon</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top pagination */}
      {hasResults && <PaginationBar />}

      {/* Results table */}
      {hasResults && (
        <div ref={tableRef} className={rowStyles.tableWrapper}>
          <div className={rowStyles.tableHeader}>
            <div className={`${rowStyles.headerCell} ${rowStyles.colNumber}`}>
              #
            </div>
            <div className={`${rowStyles.headerCell} ${rowStyles.colType}`}>
              Lead Type
            </div>
            <div className={`${rowStyles.headerCell} ${rowStyles.colBusiness}`}>
              Business
            </div>
            <div className={`${rowStyles.headerCell} ${rowStyles.colMeta}`}>
              Rating
            </div>
            <div className={`${rowStyles.headerCell} ${rowStyles.colContact}`}>
              Phone
            </div>
            <div className={`${rowStyles.headerCell} ${rowStyles.colSave}`}>
              Save
            </div>
            <div className={`${rowStyles.headerCell} ${rowStyles.colView}`}>
              View
            </div>
          </div>

          {currentPageResults.map((r, i) => {
            const globalIndex = startIdx + i + 1;
            const isPending =
              r.temperature === "cold" && pendingPlaceIds.has(r.placeId);
            const key =
              r.temperature === "cold"
                ? `cold-${r.placeId}`
                : `${r.temperature}-${r.externalId}`;
            return (
              <LeadRow
                key={key}
                result={r}
                isPending={isPending}
                onSave={() => saveLead(r)}
                index={globalIndex}
              />
            );
          })}
        </div>
      )}

      {/* Bottom pagination */}
      {hasResults && <PaginationBar />}

      {/* Empty state */}
      {!loading && !error && !hasResults && hasSearched && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No leads match your filters.</p>
          <p className={styles.emptyHint}>
            Try expanding your radius, picking more categories, or adjusting
            your sort.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && (
        <div className={styles.initialHint}>
          <p>
            Pick your filters above and hit Search to find leads in your
            territory.
          </p>
        </div>
      )}
    </div>
  );
}
