import { redirect } from "next/navigation";

export default async function LeadPreviewRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { placeId } = await params;
  const queryParams = await searchParams;

  const qs = new URLSearchParams();
  if (typeof queryParams.category === "string") {
    qs.set("category", queryParams.category);
  }
  const queryString = qs.toString();

  redirect(
    `/dashboard/leads/place/${encodeURIComponent(placeId)}${queryString ? `?${queryString}` : ""}`,
  );
}
