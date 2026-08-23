import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PurchasesManager } from "@/components/admin/purchases-manager";

export default function PurchasesPage() {
  return (
    <AdminPageShell
      title="Belian Barang"
      description="Rekod pembelian barang/bahan"
    >
      <PurchasesManager />
    </AdminPageShell>
  );
}
