import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { SalaryManager } from "@/components/admin/salary-manager";

export default function SalaryPage() {
  return (
    <AdminPageShell
      title="Gaji Founder"
      description="Rekod gaji founder"
    >
      <SalaryManager />
    </AdminPageShell>
  );
}
