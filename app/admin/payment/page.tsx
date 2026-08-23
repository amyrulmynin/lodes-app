import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PaymentSettings } from "@/components/admin/payment-settings";

export default function AdminPaymentPage() {
  return (
    <AdminPageShell
      title="Payment Settings"
      description="Setup QR code dan maklumat bank untuk paparan pembayaran customer"
    >
      <PaymentSettings />
    </AdminPageShell>
  );
}
