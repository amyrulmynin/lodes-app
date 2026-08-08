import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AffiliateDashboard } from "@/components/affiliate/dashboard";

export default async function AffiliatePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name || session.user.email || ""} role="affiliate" />
      <AffiliateDashboard />
    </div>
  );
}
