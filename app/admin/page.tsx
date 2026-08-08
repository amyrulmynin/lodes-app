import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
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
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name || session.user.email || ""} role="admin" />
      <AdminDashboard />
    </div>
  );
}
