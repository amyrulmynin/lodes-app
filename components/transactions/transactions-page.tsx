"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/financial-overview";

interface Transaction {
  id: number;
  type: "order" | "in" | "out";
  date: string;
  description: string;
  amount: string;
  status: string;
  source: string;
}

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "order" | "in" | "out">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/financial-stats");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((txn) => {
    if (filter !== "all" && txn.type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      txn.description.toLowerCase().includes(q) ||
      txn.source.toLowerCase().includes(q) ||
      txn.status.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalIncome = transactions
    .filter((t) => t.type === "order" || t.type === "in")
    .reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "out")
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
              <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                {transactions.length}
              </p>
              <p className="text-xs font-medium text-ink-500">
                Jumlah Transaksi
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs font-medium text-ink-500">
                Total Masuk
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ArrowDownRight className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-red-600 tabular-nums">
                {formatCurrency(totalExpense)}
              </p>
              <p className="text-xs font-medium text-ink-500">
                Total Keluar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => {
              setFilter("all");
              setCurrentPage(1);
            }}
          >
            Semua ({transactions.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "order" ? "default" : "outline"}
            onClick={() => {
              setFilter("order");
              setCurrentPage(1);
            }}
          >
            Order ({transactions.filter((t) => t.type === "order").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "in" ? "default" : "outline"}
            onClick={() => {
              setFilter("in");
              setCurrentPage(1);
            }}
          >
            Masuk ({transactions.filter((t) => t.type === "in").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "out" ? "default" : "outline"}
            onClick={() => {
              setFilter("out");
              setCurrentPage(1);
            }}
          >
            Keluar ({transactions.filter((t) => t.type === "out").length})
          </Button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-11"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Tarikh
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Jenis
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Deskripsi
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Sumber
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Jumlah
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-ink-400">
                      {search
                        ? "Tiada transaksi sepadan dengan carian anda"
                        : "Tiada transaksi lagi"}
                    </td>
                  </tr>
                ) : (
                  current.map((txn) => (
                    <tr
                      key={`${txn.type}-${txn.id}`}
                      className="border-b border-ink-100 last:border-0 hover:bg-ink-50 transition-colors"
                    >
                      <td className="py-3 px-3 text-sm text-ink-600 whitespace-nowrap">
                        {formatDate(new Date(txn.date))}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            txn.type === "order"
                              ? "bg-emerald-50 text-emerald-700"
                              : txn.type === "in"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {txn.type === "order" ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" /> Order
                            </>
                          ) : txn.type === "in" ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" /> Masuk
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3" /> Keluar
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-ink-700">
                        {txn.description}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-ink-900">
                        {txn.source}
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-right tabular-nums">
                        <span
                          className={
                            txn.type === "order" || txn.type === "in"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {txn.type === "order" || txn.type === "in" ? "+" : "−"}
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={txn.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-ink-100 pt-4 mt-4">
              <p className="text-sm text-ink-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center px-3">
                  <span className="text-sm font-semibold text-ink-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
