import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AgentsManager } from "@/components/admin/agents-manager";

export default function AgentsPage() {
  return (
    <AdminPageShell
      title="Agents"
      description="Urus rekod agent (dropship/pembeli) anda"
    >
      <AgentsManager />
    </AdminPageShell>
  );
}
