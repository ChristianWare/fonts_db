import { redirect, notFound } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeadDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const { id } = await params;

  const lead = await db.savedLead.findUnique({
    where: { id },
    select: {
      id: true,
      clientProfileId: true,
      googlePlaceId: true,
    },
  });

  if (!lead || lead.clientProfileId !== profile.id) {
    notFound();
  }

  if (lead.googlePlaceId) {
    redirect(`/dashboard/leads/cold/${encodeURIComponent(lead.googlePlaceId)}`);
  }

  // Lead exists but no place ID (future hot/warm leads).
  // Until those route architectures exist, send to the saved leads list.
  redirect("/dashboard/leads/saved");
}
