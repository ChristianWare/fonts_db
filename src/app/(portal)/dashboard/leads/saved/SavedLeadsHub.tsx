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
  createdAt: string;
  hasScripts: boolean;
  hasBrief: boolean;
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

type Props = {
  leads: SerializedLead[];
  counts: Counts;
};

export default function SavedLeadsHub({ leads, counts }: Props) {
  const [view, setView] = useState<ViewMode>("spreadsheet");

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>View</span>
          <div className={styles.toolbarBtnRow}>
            <button
              type='button'
              onClick={() => setView("spreadsheet")}
              className={
                view === "spreadsheet"
                  ? `${styles.toolbarBtn} ${styles.toolbarBtnActive}`
                  : styles.toolbarBtn
              }
            >
              Spreadsheet
            </button>
            <button
              type='button'
              onClick={() => setView("cards")}
              className={
                view === "cards"
                  ? `${styles.toolbarBtn} ${styles.toolbarBtnActive}`
                  : styles.toolbarBtn
              }
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {view === "spreadsheet" ? (
        <PipelineBoard
          initialLeads={leads.map((l) => ({
            id: l.id,
            googlePlaceId: l.googlePlaceId,
            status: l.status,
            category: l.category,
            businessName: l.businessName,
            rating: l.rating,
            reviewCount: l.reviewCount,
            businessPhone: l.businessPhone,
            priority: l.priority,
            createdAt: l.createdAt,
          }))}
        />
      ) : (
        <SavedLeadsView leads={leads} counts={counts} />
      )}
    </>
  );
}
