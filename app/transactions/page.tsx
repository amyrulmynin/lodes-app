import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { TransactionsPage } from "@/components/transactions/transactions-page";

export default async function Transactions() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Transactions are admin-only
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
            Transaksi
          </h1>
          <p className="mt-1 text-ink-500">
            Semua aktiviti kewangan merentasi orders dan withdrawals
          </p>
        </div>
        <TransactionsPage />
      </div>
    </div>
  );
}
