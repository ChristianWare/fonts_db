"use client";

import { useEffect, useState } from "react";
import styles from "./QuotaIndicator.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

type QuotaInfo = {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
};

type QuotaChangedEvent = CustomEvent<QuotaInfo | undefined>;

function quotaPillClass(quota: QuotaInfo): string {
  const dailyRatio = quota.dailyUsed / quota.dailyLimit;
  const monthlyRatio = quota.monthlyUsed / quota.monthlyLimit;
  const worst = Math.max(dailyRatio, monthlyRatio);
  if (worst >= 1) return `${styles.quotaPill} ${styles.quotaPillDanger}`;
  if (worst >= 0.8) return `${styles.quotaPill} ${styles.quotaPillWarning}`;
  return styles.quotaPill;
}

export default function QuotaIndicator() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    const fetchQuota = () => {
      fetch("/api/leads/quota")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setQuota(data);
        })
        .catch((err) => console.error("Quota fetch failed", err));
    };

    fetchQuota();

    // LeadSearchForm dispatches this whenever a scrape changes quota state.
    // If detail is provided, use it directly. Otherwise refetch from API.
    const handler = (e: Event) => {
      const ce = e as QuotaChangedEvent;
      if (ce.detail) {
        setQuota(ce.detail);
      } else {
        fetchQuota();
      }
    };

    window.addEventListener("leads:quota-changed", handler);
    return () => window.removeEventListener("leads:quota-changed", handler);
  }, []);

  if (!quota) return null;

  return (
    <div className={styles.quotaWrap}>
      <div className={quotaPillClass(quota)}>
        <SectionIntro
          text={`Markets scraped today: ${quota.dailyUsed}/${quota.dailyLimit}`}
        />
        <SectionIntro
          text={`Markets scraped this month: ${quota.monthlyUsed}/${quota.monthlyLimit}`}
        />
      </div>
    </div>
  );
}
