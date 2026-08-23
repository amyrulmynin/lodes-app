import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { SuppliersManager } from "@/components/admin/suppliers-manager";

export default function SuppliersPage() {
  return (
    <AdminPageShell
      title="Suppliers"
      description="Urus rekod supplier anda"
    >
      <SuppliersManager />
    </AdminPageShell>
  );
}
