import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DessertsManager } from "@/components/admin/desserts-manager";

export default function AdminDessertsPage() {
  return (
    <AdminPageShell
      title="Desserts"
      description="Tambah dan kemaskini menu dessert beserta kadar komisen"
    >
      <DessertsManager />
    </AdminPageShell>
  );
}
