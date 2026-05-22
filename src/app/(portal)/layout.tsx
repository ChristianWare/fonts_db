import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import {
  getProductAccess,
  effectiveHasLeads,
  effectiveHasWebsite,
} from "@/lib/subscriptions";
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

  // Admins see every product nav UNLESS they've subscribed and cancelled.
  // Once a subscription exists in a non-active state, admins are treated
  // the same as cancelled customers — the leads nav item disappears.
  const effectiveAccess = {
    hasWebsite: effectiveHasWebsite(access, isAdmin),
    hasLeads: effectiveHasLeads(access, isAdmin),
  };

  return <PortalLayout access={effectiveAccess}>{children}</PortalLayout>;
}
