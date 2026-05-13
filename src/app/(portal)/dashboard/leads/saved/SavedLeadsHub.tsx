"use client";

import { useState } from "react";
import PipelineBoard from "../pipeline/PipelineBoard";
import SavedLeadsView from "./SavedLeadsView";
import styles from "./SavedLeadsPage.module.css";
import type { LeadPriority } from "@/lib/leadPriority";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "NURTURING"
  | "SNOOZED"
  | "WON"
  | "DEAD";

type SerializedLead = {
  id: string;
  leadType: string;
  source: string;
  category: string;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessWebsite: string | null;
  googlePlaceId: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: LeadStatus;
  notes: string | null;
  priority: LeadPriority;
  aiScore: number | null;
  createdAt: string;
  hasScripts: boolean;
  hasBrief: boolean;
  eventbriteId: string | null;
  eventName: string | null;
  eventDate: string | null;
  venueName: string | null;
  expectedAttendance: number | null;
  organizerName: string | null;
};

type Counts = {
  all: number;
  NEW: number;
  CONTACTED: number;
  NURTURING: number;
  SNOOZED: number;
  WON: number;
  DEAD: number;
};

type ViewMode = "spreadsheet" | "cards";
type TypeFilter = "hot" | "warm" | "cold";

type Props = {
  leads: SerializedLead[];
};

export default function SavedLeadsHub({ leads }: Props) {
  const [view, setView] = useState<ViewMode>("spreadsheet");

  const typeCounts = {
    hot: leads.filter((l) => l.leadType === "HOT").length,
    warm: leads.filter((l) => l.leadType === "WARM").length,
    cold: leads.filter((l) => l.leadType === "COLD").length,
  };

  // Smart default: pick the temperature that has the most leads,
  // falling back through hot → warm → cold
  const defaultFilter: TypeFilter = (() => {
    if (typeCounts.hot > 0) return "hot";
    if (typeCounts.warm > 0) return "warm";
    return "cold";
  })();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(defaultFilter);

  const filteredLeads = leads.filter(
    (l) => l.leadType === typeFilter.toUpperCase(),
  );

  const filteredCounts: Counts = {
    all: filteredLeads.length,
    NEW: filteredLeads.filter((l) => l.status === "NEW").length,
    CONTACTED: filteredLeads.filter((l) => l.status === "CONTACTED").length,
    NURTURING: filteredLeads.filter((l) => l.status === "NURTURING").length,
    SNOOZED: filteredLeads.filter((l) => l.status === "SNOOZED").length,
    WON: filteredLeads.filter((l) => l.status === "WON").length,
    DEAD: filteredLeads.filter((l) => l.status === "DEAD").length,
  };

  function viewBtnClass(mode: ViewMode): string {
    return view === mode
      ? `${styles.toolbarBtn} ${styles.toolbarBtnActive}`
      : styles.toolbarBtn;
  }

  function typeBtnClass(filter: TypeFilter): string {
    if (typeFilter !== filter) return styles.toolbarBtn;
    const tinted =
      filter === "hot"
        ? styles.toolbarBtnHot
        : filter === "warm"
          ? styles.toolbarBtnWarm
          : styles.toolbarBtnCold;
    return `${styles.toolbarBtn} ${styles.toolbarBtnActive} ${tinted}`.trim();
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>View</span>

          <div className={styles.toolbarBtnRow}>
            <button
              type='button'
              onClick={() => setView("spreadsheet")}
              className={viewBtnClass("spreadsheet")}
            >
              Spreadsheet
            </button>
            <button
              type='button'
              onClick={() => setView("cards")}
              className={viewBtnClass("cards")}
            >
              Cards
            </button>
          </div>

          <select
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            className={styles.mobileToolbarSelect}
            aria-label='View'
          >
            <option value='spreadsheet'>Spreadsheet</option>
            <option value='cards'>Cards</option>
          </select>
        </div>

        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>Type</span>

          <div className={styles.toolbarBtnRow}>
            <button
              type='button'
              onClick={() => setTypeFilter("hot")}
              className={typeBtnClass("hot")}
            >
              🔥 Hot ({typeCounts.hot})
            </button>
            <button
              type='button'
              onClick={() => setTypeFilter("warm")}
              className={typeBtnClass("warm")}
            >
              🌡️ Warm ({typeCounts.warm})
            </button>
            <button
              type='button'
              onClick={() => setTypeFilter("cold")}
              className={typeBtnClass("cold")}
            >
              🧊 Cold ({typeCounts.cold})
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className={styles.mobileToolbarSelect}
            aria-label='Type'
          >
            <option value='hot'>🔥 Hot ({typeCounts.hot})</option>
            <option value='warm'>🌡️ Warm ({typeCounts.warm})</option>
            <option value='cold'>🧊 Cold ({typeCounts.cold})</option>
          </select>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className={styles.viewEmpty}>
          <p className={styles.viewEmptyTitle}>
            No{" "}
            {typeFilter === "hot"
              ? "🔥 Hot"
              : typeFilter === "warm"
                ? "🌡️ Warm"
                : "🧊 Cold"}{" "}
            leads yet
          </p>
          <p className={styles.viewEmptyDesc}>
            Save some {typeFilter} leads from search to see them here.
          </p>
        </div>
      ) : view === "spreadsheet" ? (
        <PipelineBoard
          key={typeFilter}
          typeFilter={typeFilter}
          initialLeads={filteredLeads.map((l) => ({
            id: l.id,
            leadType: l.leadType,
            googlePlaceId: l.googlePlaceId,
            eventbriteId: l.eventbriteId,
            status: l.status,
            category: l.category,
            businessName: l.businessName,
            rating: l.rating,
            reviewCount: l.reviewCount,
            businessPhone: l.businessPhone,
            aiScore: l.aiScore,
            createdAt: l.createdAt,
            eventName: l.eventName,
            eventDate: l.eventDate,
            venueName: l.venueName,
            expectedAttendance: l.expectedAttendance,
            organizerName: l.organizerName,
          }))}
        />
      ) : (
        <SavedLeadsView
          key={typeFilter}
          leads={filteredLeads}
          counts={filteredCounts}
        />
      )}
    </>
  );
}
