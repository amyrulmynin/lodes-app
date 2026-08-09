import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { StockManager } from "@/components/admin/stock-manager";

export default function AdminStockPage() {
  return (
    <AdminPageShell
      title="Stock"
      description="Urus stok bahan dan baca resit pembelian dengan AI"
    >
      <StockManager />
    </AdminPageShell>
  );
}
