import { redirect } from "next/navigation";
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
    where: {
      clientProfileId: profile.id,
      isFavorite: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = leads.map((l) => ({
    id: l.id,
    status: l.status,
    category: l.category,
    businessName: l.businessName,
    rating: l.rating,
    reviewCount: l.reviewCount,
    businessPhone: l.businessPhone,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Fonts &amp; Footers — Leads</p>
        <h1 className={styles.heading}>Pipeline</h1>
        <p className={styles.subhead}>
          {serialized.length} active lead
          {serialized.length === 1 ? "" : "s"}. Drag rows between sections to
          update status.
        </p>
      </div>

      <div className={styles.body}>
        <PipelineBoard initialLeads={serialized} />
      </div>
    </div>
  );
}
