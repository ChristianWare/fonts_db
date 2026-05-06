import { redirect } from "next/navigation";
import { auth } from "../../../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import PreviewClient from "./PreviewClient";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
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

  const { placeId } = await params;

  const settings = await db.leadsSettings.findUnique({
    where: { clientProfileId: profile.id },
  });

  return (
    <PreviewClient
      placeId={placeId}
      primaryLat={settings?.primaryLat ?? null}
      primaryLng={settings?.primaryLng ?? null}
      primaryCity={settings?.primaryCity ?? null}
      primaryState={settings?.primaryState ?? null}
      serviceRadiusMiles={settings?.serviceRadiusMiles ?? null}
    />
  );
}
