"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./FavoritesPage.module.css";

type SerializedFavorite = {
  id: string;
  category: string;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessWebsite: string | null;
  rating: number | null;
  reviewCount: number | null;
  createdAt: string;
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function FavoritesView({
  leads,
}: {
  leads: SerializedFavorite[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function promoteToPipeline(id: string) {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: false }),
      });
      if (res.ok) {
        startTransition(() => router.refresh());
      }
    } catch (err) {
      console.error("Promote failed", err);
    }
  }

  async function removeFavorite(id: string) {
    if (!confirm("Remove this favorite? This will permanently delete it.")) {
      return;
    }
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        startTransition(() => router.refresh());
      }
    } catch (err) {
      console.error("Remove failed", err);
    }
  }

  return (
    <div className={styles.cardsGrid}>
      {leads.map((lead) => (
        <div key={lead.id} className={styles.card}>
          <span className={styles.favoriteBadge}>♥ Favorite</span>

          <h3 className={styles.cardName}>{lead.businessName ?? "Unnamed"}</h3>

          <p className={styles.cardCategory}>
            {lead.category.replace(/_/g, " ")}
          </p>

          {lead.businessAddress && (
            <p className={styles.cardAddress}>{lead.businessAddress}</p>
          )}

          {lead.rating !== null && (
            <p className={styles.cardRating}>
              ★ {lead.rating.toFixed(1)} ({lead.reviewCount ?? 0} reviews)
            </p>
          )}

          {lead.businessPhone && (
            <a
              href={`tel:${lead.businessPhone}`}
              className={styles.cardLink}
            >
              {lead.businessPhone}
            </a>
          )}

          <p className={styles.cardSaved}>
            Favorited {formatRelative(lead.createdAt)}
          </p>

          <div className={styles.cardActions}>
            <Link
              href={`/dashboard/leads/${lead.id}`}
              className={styles.detailsLink}
            >
              View details →
            </Link>
            <button
              type="button"
              onClick={() => promoteToPipeline(lead.id)}
              className={styles.promoteBtn}
            >
              + Promote to pipeline
            </button>
            <button
              type="button"
              onClick={() => removeFavorite(lead.id)}
              className={styles.removeBtn}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}