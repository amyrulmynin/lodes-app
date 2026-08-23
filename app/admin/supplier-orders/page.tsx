import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { SupplierOrdersManager } from "@/components/admin/supplier-orders-manager";

export default function SupplierOrdersPage() {
  return (
    <AdminPageShell
      title="Supplier Orders"
      description="Urus order kepada supplier"
    >
      <SupplierOrdersManager />
    </AdminPageShell>
  );
}
