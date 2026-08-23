import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { CashFlowManager } from "@/components/admin/cash-flow-manager";

export default function CashFlowPage() {
  return (
    <AdminPageShell
      title="Duit Masuk / Keluar"
      description="Rekod aliran tunai perniagaan"
    >
      <CashFlowManager />
    </AdminPageShell>
  );
}
