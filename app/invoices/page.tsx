import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { InvoicesPage } from "@/components/invoices/invoices-page";

export default async function Invoices() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role === "admin" ? "admin" : "affiliate";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={session.user.name || session.user.email || ""}
        role={role}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvoicesPage role={role} />
      </div>
    </div>
  );
}
