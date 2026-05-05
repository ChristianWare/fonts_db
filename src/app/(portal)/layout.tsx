import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { getProductAccess } from "@/lib/subscriptions";
import PortalLayout from "@/components/portal/PortalLayout/PortalLayout";

export default async function PortalRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) redirect("/login");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;

  // Admins always see every product nav — they need to support clients
  // and demo to prospects without subscribing themselves.
  const effectiveAccess = {
    hasWebsite: isAdmin || access.hasWebsite,
    hasLeads: isAdmin || access.hasLeads,
  };

  return <PortalLayout access={effectiveAccess}>{children}</PortalLayout>;
}
