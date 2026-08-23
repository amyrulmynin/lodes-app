import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AffiliatesManager } from "@/components/admin/affiliates-manager";

export default function AdminAffiliatesPage() {
  return (
    <AdminPageShell
      title="Affiliates"
      description="Daftar dan pantau akaun affiliate anda"
    >
      <AffiliatesManager />
    </AdminPageShell>
  );
}
