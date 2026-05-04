import { getClientProfile } from "@/actions/client/getClientProfile";
import { getChangeRequests } from "@/actions/client/getChangeRequests";
import ChangeRequestsClient from "./ChangeRequestsClient";

export default async function ChangeRequestsPage() {
  const profile = await getClientProfile();
  const requests = await getChangeRequests();
  const isLive = profile?.onboardingStage === "SITE_LIVE";

  return <ChangeRequestsClient requests={requests} isLive={isLive} />;
}
