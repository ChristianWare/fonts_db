import { getClientProfile } from "@/actions/client/getClientProfile";
import { redirect } from "next/navigation";
import AssetsClient from "./AssetsClient";

export default async function AssetsPage() {
  const profile = await getClientProfile();

  if (!profile) redirect("/login");

  const clientAssets = profile.brandAssets.filter(
    (a) => a.label !== "DESIGN_OPTION",
  );

  return <AssetsClient existingAssets={clientAssets} clientId={profile.id} />;
}
