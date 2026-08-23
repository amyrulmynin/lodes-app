import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { IntegrationsManager } from "@/components/admin/integrations-manager";

export default function AdminSettingsPage() {
  return (
    <AdminPageShell
      title="Integrations"
      description="Konfigurasi AI, Telegram, dan payment gateway MudahPay"
    >
      <IntegrationsManager />
    </AdminPageShell>
  );
}
