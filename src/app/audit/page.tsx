"use client";

import { useState } from "react";
import styles from "./audit.module.css";
import AuditHero from "@/components/AuditPage/AuditHero/AuditHero";
import AuditParallaxResults from "@/components/AuditPage/AuditParallaxResults/AuditParallaxResults";
import AuditExpectations from "@/components/AuditPage/AuditExpectations/AuditExpectations";
import Faq from "@/components/HomePage/Faq/Faq";
import Img1 from "../../../public/images/audit.jpg";
import PageIntroHero from "@/components/shared/PageIntroHero/PageIntroHero";
import PricingPreview from "@/components/HomePage/PricingPreview/PricingPreview";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";

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

const heroItems = [
  {
    id: 1,
    feature: "Lost bookings",
    desc: "Your estimated monthly bookings lost to slow load times, broken booking flows, and missing trust signals — turned into a real dollar figure.",
  },
  {
    id: 2,
    feature: "Page performance",
    desc: "Core Web Vitals and mobile load times scored against the operators you're actually competing with — with the fixes that move revenue.",
  },
  {
    id: 3,
    feature: "Booking friction",
    desc: "Where prospects drop off — quote, payment, mobile usability, and account-required walls keeping them from completing the ride.",
  },
  {
    id: 4,
    feature: "Visibility & traffic",
    desc: "Your monthly traffic estimate, top keywords you rank for, and the searches your competitors are capturing instead.",
  },
];

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
      <PageIntroHero
        src={Img1}
        sectionIntroText='Free Website Audit'
        heading="Find out exactly what's costing you bookings — for free, in 60 seconds."
        subheading='$0 · Six-category scored audit · Full PDF report emailed to your inbox.'
        items={heroItems}
        copy='Built specifically for black car operators. The audit scores your site across six categories — speed, booking flow, SEO, trust signals, tech stack, and brand — and estimates the monthly bookings you are losing because of them. Free. No card. Result in 60 seconds.'
      />
      <AuditHero
        state={modalState}
        scanStep={scanStep}
        scanComplete={scanComplete}
        result={result}
        error={error}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
      <AuditExpectations />
      <AuditParallaxResults />
      <PricingPreview product='audit' />
      <Faq />
      <ContactSection />
    </main>
  );
}
