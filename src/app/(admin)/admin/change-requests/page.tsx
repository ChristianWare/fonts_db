import { getAdminChangeRequests } from "@/actions/admin/getAdminChangeRequests";
import ChangeRequestsClient from "./ChangeRequestsClient";

export default async function ChangeRequestsPage() {
  const requests = await getAdminChangeRequests();
  return <ChangeRequestsClient requests={requests} />;
}
