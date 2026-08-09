import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrdersManager } from "@/components/admin/orders-manager";

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      title="Orders"
      description="Semak dan proses order daripada affiliates"
    >
      <OrdersManager />
    </AdminPageShell>
  );
}
