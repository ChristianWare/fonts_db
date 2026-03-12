import { getSupportTickets } from "@/actions/client/getSupportTickets";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
  const tickets = await getSupportTickets();
  return <SupportClient tickets={tickets} />;
}
