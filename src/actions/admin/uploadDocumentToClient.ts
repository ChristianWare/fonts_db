"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { DocumentType } from "@prisma/client";

export const uploadDocumentToClient = async ({
  clientProfileId,
  title,
  type,
  fileUrl,
  fileName,
  requiresSignature,
}: {
  clientProfileId: string;
  title: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  requiresSignature: boolean;
}) => {
  const session = await auth();
  if (!session?.user?.roles?.includes("ADMIN"))
    return { error: "Unauthorized" };

  await db.document.create({
    data: {
      clientProfileId,
      title,
      type,
      fileUrl,
      fileName,
      requiresSignature,
      status: requiresSignature ? "PENDING_SIGNATURE" : "UPLOADED",
      uploadedById: session.user.id,
      visible: true,
    },
  });

  return { success: true };
};
