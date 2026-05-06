import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import PipelineBoard from "./PipelineBoard";
import styles from "./PipelinePage.module.css";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
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

  const leads = await db.savedLead.findMany({
    where: { clientProfileId: profile.id, isFavorite: false },
    orderBy: { createdAt: "desc" },
  });

  const serialized = leads.map((l) => ({
    id: l.id,
    category: l.category,
    businessName: l.businessName,
    businessAddress: l.businessAddress,
    rating: l.rating,
    reviewCount: l.reviewCount,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Pipeline</h1>
      </div>

      <div className={styles.body}>
        {leads.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No leads in your pipeline</p>
            <p className={styles.emptyDesc}>
              Search for businesses and save them to populate your pipeline.
              Drag cards across columns to track them through your sales
              process.
            </p>
            <Link href='/dashboard/leads/search' className={styles.emptyCta}>
              Search for leads →
            </Link>
          </div>
        ) : (
          <PipelineBoard leads={serialized} />
        )}
      </div>
    </div>
  );
}
