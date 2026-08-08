import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { InvoicesPage } from "@/components/invoices/invoices-page";

export default async function Invoices() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Invoices are admin-only
  if (session.user.role !== "admin") {
    redirect("/affiliate");
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <Navbar
        userName={session.user.name || session.user.email || ""}
        role="admin"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight text-ink-950">
            Invoices
          </h1>
          <p className="mt-1 text-ink-500">
            Jana dan urus invoice untuk customer
          </p>
        </div>
        <InvoicesPage role="admin" />
      </div>
    </div>
  );
}
