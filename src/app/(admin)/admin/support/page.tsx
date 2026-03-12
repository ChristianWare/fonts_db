import { getAdminSupportTickets } from "@/actions/admin/getAdminSupportTickets";
import AdminSupportClient from "./AdminSupportClient";

export default async function AdminSupportPage() {
  const tickets = await getAdminSupportTickets();
  return <AdminSupportClient tickets={tickets} />;
}
