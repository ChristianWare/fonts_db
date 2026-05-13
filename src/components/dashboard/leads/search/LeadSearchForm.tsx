"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import styles from "./SearchPage.module.css";
import rowStyles from "./cards/LeadRow.module.css";
import LeadRow from "./cards/LeadRow";
import type { Temperature, SavedState, SearchResult } from "./cards/types";

type SortOption = "distance" | "rating" | "reviews" | "name";

type ScrapePhase = {
  jobId: string;
  stage: string;
  progressPct: number;
  marketCity: string;
  marketState: string;
  startedAt: number;
};

type QuotaError = {
  reason: "DAILY_LIMIT" | "MONTHLY_LIMIT";
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number;
  monthlyLimit: number;
};

const RESULTS_PER_PAGE = 20;
const POLL_INTERVAL_MS = 3000;

const TEMPERATURES: Array<{
  value: Temperature;
  label: string;
  emoji: string;
  enabled: boolean;
}> = [
  { value: "hot", label: "Hot", emoji: "🔥", enabled: true },
  { value: "warm", label: "Warm", emoji: "🌡️", enabled: true },
  { value: "cold", label: "Cold", emoji: "🧊", enabled: true },
];

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

const LEAD_TYPE_COPY: Record<Temperature, string[]> = {
  cold: [
    "Cold leads are businesses in your service area that fit your ideal customer profile — wedding venues, hotels, corporate offices, country clubs, funeral homes. No specific event signal yet, but they're the right type of organization to be pitching.",
    "Best for long-term pipeline building. Strategy: introduce yourself, drop a useful resource (rate sheet, hotel-pickup logistics guide), follow up quarterly. These won't convert quickly, but they compound over time as your name becomes familiar.",
  ],
  warm: [
    "Warm leads are events happening 15-90 days out in your market — corporate conferences, weddings, fundraisers, and professional gatherings. Pulled from Eventbrite and enriched with venue contacts, organizer info, and an AI-generated strategic brief.",
    "The organizer is actively coordinating logistics this month. Transportation is on their mind but no decision has been finalized. Strategy: reference the specific event in your outreach, pitch as the missing piece of guest experience, aim for a 24-48 hour response.",
  ],
  hot: [
    "Hot leads are events happening in the next 14 days. Pulled from Eventbrite and fully enriched — venue contact, organizer profile, decision-maker hypothesis, and outreach scripts ready to send.",
    "The organizer is finalizing every detail right now — including ground transportation. Speed is everything; first responder usually wins. Strategy: skip the long pitch, send three sentences today, be ready to quote within hours, not days.",
  ],
};

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "reviews", label: "Reviews" },
  { value: "name", label: "Name (A–Z)" },
];

const MIN_SCORE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Any" },
  { value: 25, label: "25+" },
  { value: 50, label: "50+" },
  { value: 75, label: "75+" },
  { value: 85, label: "85+ (top)" },
];

const STORAGE_KEY = "leadSearch:state:v9";
const DEFAULT_MIN_SCORE = 50;

type StoredState = {
  selectedTemperature: Temperature | null;
  selectedCategories: string[];
  sortBy: SortOption;
  freshOnly: boolean;
  contactReadyOnly: boolean;
  minScore: number;
  searchedTemperature: Temperature | null;
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

function formatElapsed(startedAtMs: number): string {
  const seconds = Math.floor((Date.now() - startedAtMs) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${min}m ${rem}s`;
}

function resultPassesScoreFilter(r: SearchResult, minScore: number): boolean {
  if (r.temperature === "cold") return true;
  if (minScore <= 0) return true;
  const score = r.aiScore ?? 0;
  return score >= minScore;
}

export default function LeadSearchForm() {
  const [selectedTemperature, setSelectedTemperature] =
    useState<Temperature | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [freshOnly, setFreshOnly] = useState(false);
  const [contactReadyOnly, setContactReadyOnly] = useState(false);
  const [minScore, setMinScore] = useState<number>(DEFAULT_MIN_SCORE);

  const [searchedTemperature, setSearchedTemperature] =
    useState<Temperature | null>(null);
  const [searchedCategories, setSearchedCategories] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlaceIds, setPendingPlaceIds] = useState<Set<string>>(
    new Set(),
  );
  const [hasSearched, setHasSearched] = useState(false);

  const [scrapePhase, setScrapePhase] = useState<ScrapePhase | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaError | null>(null);
  const [, setElapsedTick] = useState(0);

  const hydrated = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const executeSearchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const stored = loadStored();
    if (stored && stored.searchedTemperature) {
      setSelectedTemperature(stored.selectedTemperature);
      setSelectedCategories(stored.selectedCategories);
      setSortBy(stored.sortBy ?? "distance");
      setFreshOnly(stored.freshOnly ?? false);
      setContactReadyOnly(stored.contactReadyOnly ?? false);
      setMinScore(stored.minScore ?? DEFAULT_MIN_SCORE);
      setSearchedTemperature(stored.searchedTemperature);
      setSearchedCategories(stored.searchedCategories);
      setResults(stored.results ?? []);
      setCurrentPage(stored.currentPage ?? 1);
      setHasSearched(true);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (!hasSearched) return;
    saveStored({
      selectedTemperature,
      selectedCategories,
      sortBy,
      freshOnly,
      contactReadyOnly,
      minScore,
      searchedTemperature,
      searchedCategories,
      results,
      currentPage,
    });
  }, [
    selectedTemperature,
    selectedCategories,
    sortBy,
    freshOnly,
    contactReadyOnly,
    minScore,
    searchedTemperature,
    searchedCategories,
    results,
    currentPage,
    hasSearched,
  ]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (!hasSearched) return;
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, freshOnly]);

  // Reset to page 1 when any client-side filter changes
  useEffect(() => {
    if (!hydrated.current) return;
    setCurrentPage(1);
  }, [contactReadyOnly, minScore]);

  useEffect(() => {
    if (!scrapePhase) return;
    const id = setInterval(() => setElapsedTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [scrapePhase]);

  useEffect(() => {
    if (!scrapePhase?.jobId) return;
    const jobId = scrapePhase.jobId;
    const marketCity = scrapePhase.marketCity;
    const marketState = scrapePhase.marketState;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/leads/search/status?jobId=${jobId}`);
        if (cancelled) return;
        if (!res.ok) throw new Error(`Status check failed (${res.status})`);
        const data = await res.json();

        setScrapePhase((prev) =>
          prev && prev.jobId === jobId
            ? {
                ...prev,
                stage: data.stage ?? prev.stage,
                progressPct: data.progressPct ?? prev.progressPct,
              }
            : prev,
        );

        if (data.status === "COMPLETE") {
          setScrapePhase(null);
          toast.success(
            `${data.eventCount ?? 0} events ready for ${marketCity}, ${marketState}`,
          );
          window.dispatchEvent(new Event("leads:quota-changed"));
          executeSearchRef.current();
          return;
        }

        if (data.status === "FAILED") {
          const msg = data.error ?? "Try again in a few seconds.";
          setError(`Scrape failed: ${msg}`);
          toast.error(`Scrape failed for ${marketCity}, ${marketState}`);
          setScrapePhase(null);
          return;
        }

        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        console.error("Poll error", err);
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    timeoutId = setTimeout(poll, 1000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [scrapePhase?.jobId, scrapePhase?.marketCity, scrapePhase?.marketState]);

  function pickTemperature(t: Temperature | null) {
    if (t === null) {
      setSelectedTemperature(null);
      setSelectedCategories([]);
      return;
    }
    const def = TEMPERATURES.find((x) => x.value === t);
    if (!def?.enabled) return;
    if (selectedTemperature === t) {
      setSelectedTemperature(null);
      setSelectedCategories([]);
      return;
    }
    setSelectedTemperature(t);
    if (t !== "cold") {
      setSelectedCategories([]);
    }
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

  function handleMobileCategoriesChange(
    e: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value,
    );
    setSelectedCategories(selected);
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
    if (!selectedTemperature) return;
    setLoading(true);
    setError(null);
    setQuotaError(null);
    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          temperatures: [selectedTemperature],
          sortBy,
          freshOnly,
        }),
      });

      const text = await res.text();
      let data: {
        status?: string;
        results?: SearchResult[];
        error?: string;
        jobId?: string;
        stage?: string;
        progressPct?: number;
        reason?: "DAILY_LIMIT" | "MONTHLY_LIMIT";
        dailyUsed?: number;
        monthlyUsed?: number;
        dailyLimit?: number;
        monthlyLimit?: number;
      } = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }

      if (data.status === "scraping" && data.jobId) {
        if (
          data.dailyUsed != null &&
          data.monthlyUsed != null &&
          data.dailyLimit != null &&
          data.monthlyLimit != null
        ) {
          window.dispatchEvent(
            new CustomEvent("leads:quota-changed", {
              detail: {
                dailyUsed: data.dailyUsed,
                dailyLimit: data.dailyLimit,
                monthlyUsed: data.monthlyUsed,
                monthlyLimit: data.monthlyLimit,
              },
            }),
          );
        }
        setScrapePhase({
          jobId: data.jobId,
          stage: data.stage ?? "Starting up",
          progressPct: data.progressPct ?? 0,
          marketCity: "",
          marketState: "",
          startedAt: Date.now(),
        });
        setResults([]);
        return;
      }

      if (data.status === "quota_exceeded") {
        setQuotaError({
          reason: data.reason ?? "DAILY_LIMIT",
          dailyUsed: data.dailyUsed ?? 0,
          monthlyUsed: data.monthlyUsed ?? 0,
          dailyLimit: data.dailyLimit ?? 5,
          monthlyLimit: data.monthlyLimit ?? 15,
        });
        window.dispatchEvent(
          new CustomEvent("leads:quota-changed", {
            detail: {
              dailyUsed: data.dailyUsed ?? 0,
              dailyLimit: data.dailyLimit ?? 5,
              monthlyUsed: data.monthlyUsed ?? 0,
              monthlyLimit: data.monthlyLimit ?? 15,
            },
          }),
        );
        setResults([]);
        return;
      }

      setResults(data.results ?? []);
      setCurrentPage(1);
      setScrapePhase(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  executeSearchRef.current = executeSearch;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemperature) {
      setError("Pick a lead type to search.");
      return;
    }
    if (selectedTemperature === "cold" && selectedCategories.length === 0) {
      setError("Pick at least one category for cold leads.");
      return;
    }
    setSearchedTemperature(selectedTemperature);
    setSearchedCategories([...selectedCategories]);
    setHasSearched(true);
    executeSearch();
  }

  // ============= Display pipeline =============
  // 1. Sort: contact-ready leads first, preserve API order otherwise
  // 2. Apply Ready Only filter (warm/hot only)
  // 3. Apply Min Score filter (warm/hot only)
  const displayResults = useMemo(() => {
    const ready = results.filter((r) => r.contactReady);
    const notReady = results.filter((r) => !r.contactReady);
    let sorted = [...ready, ...notReady];

    const filtersApply = searchedTemperature !== "cold";
    if (filtersApply && contactReadyOnly) {
      sorted = sorted.filter((r) => r.contactReady);
    }
    if (filtersApply) {
      sorted = sorted.filter((r) => resultPassesScoreFilter(r, minScore));
    }
    return sorted;
  }, [results, contactReadyOnly, minScore, searchedTemperature]);

  const readyCount = useMemo(
    () => results.filter((r) => r.contactReady).length,
    [results],
  );

  const hiddenByFilters = results.length - displayResults.length;

  const totalPages = Math.max(
    1,
    Math.ceil(displayResults.length / RESULTS_PER_PAGE),
  );
  const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIdx = startIdx + RESULTS_PER_PAGE;
  const currentPageResults = useMemo(
    () => displayResults.slice(startIdx, endIdx),
    [displayResults, startIdx, endIdx],
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
        toast.success(`Saved ${result.name} to pipeline`);
      } else {
        toast.error("Save failed — try again");
      }
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Save failed — try again");
    } finally {
      setPending(result.placeId, false);
    }
  }

  const hasResults = results.length > 0;
  const hasDisplayResults = displayResults.length > 0;
  const canSearch =
    selectedTemperature !== null &&
    (selectedTemperature !== "cold" || selectedCategories.length > 0);
  const isScraping = scrapePhase !== null;
  const showResultsSection = hasDisplayResults && !isScraping && !quotaError;
  const showFilteredEmpty =
    !loading &&
    !error &&
    !isScraping &&
    !quotaError &&
    hasResults &&
    !hasDisplayResults;
  const showEmptyState =
    !loading &&
    !error &&
    !isScraping &&
    !quotaError &&
    !hasResults &&
    hasSearched;
  const showInitialState = !hasSearched && !isScraping && !quotaError;

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
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Select your lead type</label>
          </div>

          <div className={styles.pillRow}>
            {TEMPERATURES.map((t) => {
              const selected = selectedTemperature === t.value;
              return (
                <button
                  key={t.value}
                  type='button'
                  onClick={() => pickTemperature(t.value)}
                  disabled={!t.enabled || isScraping}
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

          <select
            value={selectedTemperature ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              pickTemperature(v === "" ? null : (v as Temperature));
            }}
            disabled={isScraping}
            className={styles.mobileSelect}
            aria-label='Lead type'
          >
            <option value=''>— Select your lead type —</option>
            {TEMPERATURES.map((t) => (
              <option key={t.value} value={t.value} disabled={!t.enabled}>
                {t.emoji} {t.label}
                {!t.enabled ? " (Soon)" : ""}
              </option>
            ))}
          </select>

          {selectedTemperature && (
            <div
              className={`${styles.leadTypeExplanation} ${
                styles[`leadTypeExplanation_${selectedTemperature}`]
              }`}
            >
              {LEAD_TYPE_COPY[selectedTemperature].map((para, i) => (
                <p key={i} className={styles.leadTypeExplanationParagraph}>
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>

        {selectedTemperature === "cold" && (
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
                    disabled={isScraping}
                    className={`${styles.pill} ${
                      selected ? styles.pillActive : ""
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <select
              multiple
              value={selectedCategories}
              onChange={handleMobileCategoriesChange}
              disabled={isScraping}
              className={styles.mobileMultiSelect}
              aria-label='Categories'
              size={CATEGORIES.length}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className={styles.mobileHint}>
              Tap to select. Hold to select multiple.
            </p>
          </div>
        )}

        <div className={styles.submitRow}>
          <button
            type='submit'
            disabled={loading || !canSearch || isScraping}
            className={styles.searchBtn}
          >
            {loading ? "Searching..." : isScraping ? "Scraping..." : "Search"}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {scrapePhase && (
        <div className={styles.scrapeProgressCard}>
          <div className={styles.scrapeProgressHeader}>
            <p className={styles.scrapeProgressEyebrow}>On-demand scrape</p>
            <h2 className={styles.scrapeProgressTitle}>
              Pulling fresh data for your market
            </h2>
            <p className={styles.scrapeProgressDesc}>
              We don&apos;t have cached data for this market yet, so we&apos;re
              pulling events from Eventbrite, categorizing them with AI, and
              enriching with venue + organizer contacts. Usually takes 1 - 3
              minutes.
            </p>
          </div>

          <div className={styles.scrapeProgressBarWrap}>
            <div
              className={styles.scrapeProgressBarFill}
              style={{ width: `${scrapePhase.progressPct}%` }}
            />
          </div>

          <div className={styles.scrapeProgressMeta}>
            <span className={styles.scrapeProgressStage}>
              {scrapePhase.stage}
            </span>
            <span className={styles.scrapeProgressPct}>
              {scrapePhase.progressPct}% ·{" "}
              {formatElapsed(scrapePhase.startedAt)}
            </span>
          </div>
        </div>
      )}

      {quotaError && (
        <div className={styles.quotaErrorCard}>
          <p className={styles.quotaErrorEyebrow}>Limit reached</p>
          <h2 className={styles.quotaErrorTitle}>
            {quotaError.reason === "DAILY_LIMIT"
              ? "Daily market limit reached"
              : "Monthly market limit reached"}
          </h2>
          <p className={styles.quotaErrorDesc}>
            You&apos;ve scraped {quotaError.dailyUsed} of{" "}
            {quotaError.dailyLimit} new markets today and{" "}
            {quotaError.monthlyUsed} of {quotaError.monthlyLimit} this month.
            {quotaError.reason === "DAILY_LIMIT"
              ? " Your daily limit resets at midnight."
              : " Your monthly limit resets on the 1st of next month."}
          </p>
          <p className={styles.quotaErrorHint}>
            Markets you&apos;ve already scraped keep working with no extra cost
            — only NEW markets count against your limit. Try one of those
            instead, or wait for your limit to reset.
          </p>
        </div>
      )}

      {showResultsSection && (
        <>
          <div
            className={`${styles.resultsHeader} ${
              styles[`resultsHeader_${searchedTemperature}`]
            }`}
          >
            <div className={styles.resultsHeaderType}>
              <span className={styles.resultsHeaderEmoji}>
                {searchedTemperature === "hot"
                  ? "🔥"
                  : searchedTemperature === "warm"
                    ? "🌡️"
                    : "🧊"}
              </span>
              <h2 className={styles.resultsHeaderLabel}>
                {searchedTemperature === "hot"
                  ? "Hot leads"
                  : searchedTemperature === "warm"
                    ? "Warm leads"
                    : "Cold leads"}
              </h2>
            </div>
            <div className={styles.resultsHeaderMeta}>
              <span className={styles.resultsHeaderCount}>
                {displayResults.length}{" "}
                {displayResults.length === 1 ? "result" : "results"}
              </span>
              {hiddenByFilters > 0 && (
                <>
                  <span className={styles.resultsHeaderDivider}>·</span>
                  <span>{hiddenByFilters} hidden by filters</span>
                </>
              )}
              {hiddenByFilters === 0 &&
                readyCount > 0 &&
                searchedTemperature !== "cold" && (
                  <>
                    <span className={styles.resultsHeaderDivider}>·</span>
                    <span>{readyCount} contact ready</span>
                  </>
                )}
              {searchedTemperature === "cold" &&
                searchedCategories.length > 0 && (
                  <>
                    <span className={styles.resultsHeaderDivider}>·</span>
                    <span>
                      {searchedCategories.length}{" "}
                      {searchedCategories.length === 1
                        ? "category"
                        : "categories"}
                    </span>
                  </>
                )}
            </div>
          </div>

          <div className={styles.filtersBar}>
            <div className={styles.filtersBarLeft}>
              <span className={styles.filtersBarCount}>
                {displayResults.length}{" "}
                {displayResults.length === 1 ? "result" : "results"}
              </span>
              {totalPages > 1 && (
                <span className={styles.filtersBarPages}>
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>

            <div className={styles.filtersBarRight}>
              {searchedTemperature !== "cold" && (
                <div className={styles.filterControl}>
                  <label
                    htmlFor='minScore'
                    className={styles.filterControlLabel}
                  >
                    Min score
                  </label>
                  <select
                    id='minScore'
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className={styles.filterControlSelect}
                    disabled={loading}
                  >
                    {MIN_SCORE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {searchedTemperature !== "cold" && (
                <div className={styles.filterControl}>
                  <label className={styles.filterControlLabel}>
                    Ready only
                  </label>
                  <button
                    type='button'
                    onClick={() => setContactReadyOnly(!contactReadyOnly)}
                    className={`${styles.filterControlToggle} ${
                      contactReadyOnly ? styles.filterControlToggleOn : ""
                    }`}
                  >
                    {contactReadyOnly ? "On" : "Off"}
                  </button>
                </div>
              )}

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

          <PaginationBar />

          <div ref={tableRef} className={rowStyles.tableWrapper}>
            <div className={rowStyles.tableHeader}>
              <div className={`${rowStyles.headerCell} ${rowStyles.colNumber}`}>
                #
              </div>
              <div className={`${rowStyles.headerCell} ${rowStyles.colType}`}>
                Lead Type
              </div>
              <div
                className={`${rowStyles.headerCell} ${rowStyles.colBusiness}`}
              >
                {searchedTemperature === "cold" ? "Business" : "Event"}
              </div>
              <div className={`${rowStyles.headerCell} ${rowStyles.colMeta}`}>
                {searchedTemperature === "cold" ? "Rating" : "Date"}
              </div>
              <div
                className={`${rowStyles.headerCell} ${rowStyles.colContact}`}
              >
                {searchedTemperature === "cold"
                  ? "Phone"
                  : searchedTemperature === "warm"
                    ? "Venue"
                    : "Time left"}
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

          <PaginationBar />
        </>
      )}

      {showFilteredEmpty && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No leads match your filters</p>
          <p className={styles.emptyHint}>
            Found {results.length} {results.length === 1 ? "lead" : "leads"},
            but all are hidden by your active filters. Try lowering the minimum
            score or turning off &quot;Ready only.&quot;
          </p>
        </div>
      )}

      {showEmptyState && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No leads match your filters.</p>
          <p className={styles.emptyHint}>
            Try expanding your radius, picking more categories, or adjusting
            your sort.
          </p>
        </div>
      )}

      {showInitialState && (
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
