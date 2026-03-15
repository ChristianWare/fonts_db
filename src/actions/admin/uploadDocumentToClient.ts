"use server";

import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { DocumentType } from "@prisma/client";
import { sendDocumentReadyEmail } from "@/lib/emails";

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

  const document = await db.document.create({
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

  // If signature required, email the client
  if (requiresSignature) {
    const profile = await db.clientProfile.findUnique({
      where: { id: clientProfileId },
      include: { user: true },
    });

    if (profile?.user?.email) {
      await sendDocumentReadyEmail({
        to: profile.user.email,
        name: profile.user.name ?? "Client",
        documentTitle: title,
        documentId: document.id,
      });
    }
  }

  return { success: true };
};
