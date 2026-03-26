"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";

export async function getClientBlueprintPages() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return null;

  return db.sitemapPage.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { position: "asc" },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: {
          comments: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
}

export async function getClientBlueprintStatus() {
  const session = await auth();
  if (!session?.user?.id)
    return {
      hasBlueprint: false,
      totalSections: 0,
      approvedSections: 0,
      isFullyApproved: false,
    };

  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile)
    return {
      hasBlueprint: false,
      totalSections: 0,
      approvedSections: 0,
      isFullyApproved: false,
    };

  const pages = await db.sitemapPage.findMany({
    where: { clientProfileId: profile.id },
    include: { sections: { select: { status: true } } },
  });

  const totalSections = pages.reduce((acc, p) => acc + p.sections.length, 0);
  const approvedSections = pages.reduce(
    (acc, p) => acc + p.sections.filter((s) => s.status === "APPROVED").length,
    0,
  );

  return {
    hasBlueprint: pages.length > 0 && totalSections > 0,
    totalSections,
    approvedSections,
    isFullyApproved: totalSections > 0 && approvedSections === totalSections,
  };
}
