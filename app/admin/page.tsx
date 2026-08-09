import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminDashboard } from "@/components/admin/dashboard";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/affiliate");
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <AdminSidebar userName={session.user.name || session.user.email || ""} />
      <div className="lg:pl-64">
        <AdminDashboard />
      </div>
    </div>
  );
}
