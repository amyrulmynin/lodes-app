import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { WithdrawalsManager } from "@/components/admin/withdrawals-manager";

export default function AdminWithdrawalsPage() {
  return (
    <AdminPageShell
      title="Withdrawals"
      description="Proses permintaan pengeluaran komisen affiliate"
    >
      <WithdrawalsManager />
    </AdminPageShell>
  );
}
