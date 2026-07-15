import { getClientProfile } from "@/actions/client/getClientProfile";
import { redirect } from "next/navigation";
import SignClient from "./SignClient";

export default async function SignDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getClientProfile();

  if (!profile) redirect("/dashboard");

  const document = profile.documents.find((d) => d.id === id && d.visible);

  if (!document) redirect("/dashboard/website/documents");

  // Already signed — nothing to do
  if (document.status === "SIGNED") redirect("/dashboard/website/documents");

  // Doesn't need a signature — nothing to do
  if (!document.requiresSignature) redirect("/dashboard/website/documents");

  return <SignClient document={document} />;
}
