import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import FavoritesView from "./FavoritesView";
import styles from "./FavoritesPage.module.css";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;
  if (!access.hasLeads && !isAdmin) {
    redirect("/dashboard/enroll/leads");
  }

  const favorites = await db.savedLead.findMany({
    where: {
      clientProfileId: profile.id,
      isFavorite: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = favorites.map((l) => ({
    id: l.id,
    category: l.category,
    businessName: l.businessName,
    businessAddress: l.businessAddress,
    businessPhone: l.businessPhone,
    businessWebsite: l.businessWebsite,
    rating: l.rating,
    reviewCount: l.reviewCount,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Favorites</h1>
      </div>

      <div className={styles.body}>
        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No favorites yet</p>
            <p className={styles.emptyDesc}>
              Click the heart icon on any search result to bookmark it here.
              Favorites are leads you&apos;re still researching — they
              don&apos;t clutter your active pipeline.
            </p>
            <Link href='/dashboard/leads/search' className={styles.emptyCta}>
              Search for leads →
            </Link>
          </div>
        ) : (
          <FavoritesView leads={serialized} />
        )}
      </div>
    </div>
  );
}
