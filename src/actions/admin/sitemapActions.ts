"use server";

import { db } from "@/lib/db";

export async function createSitemapPage(
  clientProfileId: string,
  name: string,
  parentId?: string | null,
) {
  const count = await db.sitemapPage.count({ where: { clientProfileId } });
  return db.sitemapPage.create({
    data: {
      clientProfileId,
      name,
      position: count,
      ...(parentId ? { parentId } : {}),
    },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: { comments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
}

export async function deleteSitemapPage(pageId: string) {
  return db.sitemapPage.delete({ where: { id: pageId } });
}

export async function deleteAllClientSitemapPages(clientProfileId: string) {
  return db.sitemapPage.deleteMany({ where: { clientProfileId } });
}

export async function createSitemapSection(pageId: string, title: string) {
  const count = await db.sitemapSection.count({ where: { pageId } });
  return db.sitemapSection.create({
    data: { pageId, title, position: count },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateSitemapSection(
  sectionId: string,
  data: { copy?: string; status?: "DRAFT" | "REVIEW" | "APPROVED" },
) {
  return db.sitemapSection.update({
    where: { id: sectionId },
    data,
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
}

export async function createSitemapComment(
  sectionId: string,
  text: string,
  authorType: "admin" | "client",
) {
  return db.sitemapComment.create({
    data: { sectionId, text, authorType },
  });
}
