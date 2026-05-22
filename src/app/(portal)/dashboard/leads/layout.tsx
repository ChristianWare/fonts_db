import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { getProductAccess, effectiveHasLeads } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default async function LeadsLayout({
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
  if (!profile) redirect("/dashboard");

  const access = await getProductAccess(profile.id);
  const isAdmin = session.user.roles?.includes("ADMIN") ?? false;

  // Single source of truth for "can this user see anything under /dashboard/leads".
  // Covers /search, /saved, /settings, /welcome, /warm/[id], /hot/[id], /cold/[id]
  // — every leads route inherits this guard automatically.
  if (!effectiveHasLeads(access, isAdmin)) {
    redirect("/dashboard/enroll/leads");
  }

  return <>{children}</>;
}
