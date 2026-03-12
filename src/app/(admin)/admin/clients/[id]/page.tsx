import { getClientById } from "@/actions/admin/getClientById";
import { notFound } from "next/navigation";
import ClientDetailClient from "./ClientDetailClient";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();
  return <ClientDetailClient client={client} />;
}
