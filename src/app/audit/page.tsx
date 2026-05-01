"use client";

import { useState } from "react";
import styles from "./audit.module.css";
import AuditHero from "@/components/AuditPage/AuditHero/AuditHero";
import AuditHowItWorks from "@/components/AuditPage/AuditHowItWorks/AuditHowItWorks";
import AuditParallaxResults from "@/components/AuditPage/AuditParallaxResults/AuditParallaxResults";
import AuditExpectations from "@/components/AuditPage/AuditExpectations/AuditExpectations";
import Faq from "@/components/HomePage/Faq/Faq";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TechStack {
  platform: string | null;
  bookingPlatform: string | null;
  analytics: string[];
  hasFavicon: boolean;
  hasSchemaMarkup: boolean;
  hasSocialLinks: boolean;
  copyrightYearCurrent: boolean;
}

export interface AuditResult {
  url: string;
  score: number;
  grade: string;
  categories: Category[];
  summary: string;
  monthlyVisitors: number;
  keywordsRanking: number;
  topKeywords: string[];
  estimatedLostBookings: number;
  email?: string;
  firstName?: string;
  techStack?: TechStack;
}

export interface Category {
  id: string;
  label: string;
  grade: string;
  score: number;
  checks: Check[];
}

export interface Check {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  fix?: string;
  impact: "high" | "medium" | "low";
}

export const SCAN_STEPS = [
  "Resolving domain...",
  "Checking SSL certificate...",
  "Testing page speed...",
  "Scanning mobile responsiveness...",
  "Analysing booking capability...",
  "Reading SEO signals...",
  "Fetching keyword traffic data...",
  "Checking trust indicators...",
  "Calculating lost bookings...",
  "Compiling your report...",
];

export type ModalState = "form" | "scanning" | "results";

export default function AuditPage() {
  const [modalState, setModalState] = useState<ModalState>("form");
  const [scanStep, setScanStep] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(url: string, email: string, firstName: string) {
    setError("");
    setScanComplete(false);
    setModalState("scanning");
    setScanStep(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setScanStep(i);
    }

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email, firstName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Audit failed");

      setScanComplete(true);
      await new Promise((r) => setTimeout(r, 600));

      setResult({ ...data, email, firstName });
      setModalState("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setModalState("form");
      setScanComplete(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError("");
    setScanComplete(false);
    setScanStep(0);
    setModalState("form");
  }

  return (
    <main className={styles.container}>
      <AuditHero
        state={modalState}
        scanStep={scanStep}
        scanComplete={scanComplete}
        result={result}
        error={error}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
      <AuditHowItWorks />
      <AuditParallaxResults />
      <AuditExpectations />
      <Faq />
    </main>
  );
}
