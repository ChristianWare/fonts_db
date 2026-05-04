import { getClientProfile } from "@/actions/client/getClientProfile";
import { getDesignOptions } from "@/actions/client/getDesignOptions";
import { redirect } from "next/navigation";
import DesignSelectionClient from "./DesignSelectionClient";

export default async function DesignSelectionPage() {
  const profile = await getClientProfile();

  if (!profile) redirect("/login");

  const options = await getDesignOptions();
  const selectedOption = options.find((o) => o.selected) ?? null;

  return (
    <DesignSelectionClient options={options} selectedOption={selectedOption} />
  );
}
