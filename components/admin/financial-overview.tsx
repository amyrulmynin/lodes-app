"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FinancialStats {
  totalRevenue: string;
  totalCommissions: string;
  totalWithdrawals: string;
  netProfit: string;
  pendingOrders: number;
  acceptedOrders: number;
  pendingWithdrawals: number;
  totalAffiliates: number;
}

interface Transaction {
  id: number;
  type: "order" | "withdrawal";
  date: string;
  description: string;
  amount: string;
  status: string;
  affiliate: string;
}

export function FinancialOverview() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const res = await fetch("/api/admin/financial-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Revenue",
      value: stats?.totalRevenue || "0",
      hint: "Dari semua order diterima",
      icon: TrendingUp,
      featured: true,
    },
    {
      label: "Commissions Paid",
      value: stats?.totalWithdrawals || "0",
      hint: "Jumlah withdrawal diproses",
      icon: TrendingDown,
      featured: false,
    },
    {
      label: "Pending Commissions",
      value: stats?.totalCommissions || "0",
      hint: "Dalam baki affiliate",
      icon: Wallet,
      featured: false,
    },
    {
      label: "Net Profit",
      value: stats?.netProfit || "0",
      hint: "Revenue tolak komisen",
      icon: ShoppingCart,
      featured: false,
    },
  ];

  const quickStats = [
    { label: "Pending Orders", value: stats?.pendingOrders || 0, icon: ShoppingCart },
    { label: "Accepted Orders", value: stats?.acceptedOrders || 0, icon: ShoppingCart },
    { label: "Pending Withdrawals", value: stats?.pendingWithdrawals || 0, icon: Wallet },
    { label: "Total Affiliates", value: stats?.totalAffiliates || 0, icon: Users },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards — 1 featured (brand), rest neutral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return card.featured ? (
            <Card
              key={card.label}
              className="bg-ink-950 border-ink-950 text-white relative overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary-500/25 blur-2xl pointer-events-none"
              />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-ink-950">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                </div>
                <p className="text-sm font-medium text-ink-300">{card.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-primary-400 tabular-nums">
                  {formatCurrency(card.value)}
                </p>
                <p className="mt-2 text-xs text-ink-400">{card.hint}</p>
              </CardContent>
            </Card>
          ) : (
            <Card key={card.label} className="hover:shadow-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                </div>
                <p className="text-sm font-medium text-ink-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {formatCurrency(card.value)}
                </p>
                <p className="mt-2 text-xs text-ink-400">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-ink-200/70 bg-white px-5 py-4"
            >
              <Icon className="h-5 w-5 text-ink-400" strokeWidth={2} />
              <div>
                <p className="text-xl font-bold text-ink-950 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-ink-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaksi Terkini</CardTitle>
          <p className="text-sm text-ink-500">
            Aktiviti kewangan terbaru merentasi orders dan withdrawals
          </p>
        </CardHeader>
        <CardContent>
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
                    Affiliate
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-ink-400">
                      Tiada transaksi lagi
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
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
                              : "bg-primary-50 text-primary-800"
                          }`}
                        >
                          {txn.type === "order" ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" /> Income
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3" /> Payout
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-ink-700">
                        {txn.description}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-ink-900">
                        {txn.affiliate}
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-right tabular-nums">
                        <span
                          className={
                            txn.type === "order"
                              ? "text-emerald-600"
                              : "text-ink-900"
                          }
                        >
                          {txn.type === "order" ? "+" : "−"}
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
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-emerald-50 text-emerald-700",
    pending: "bg-primary-100 text-primary-800",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
        styles[status] || "bg-ink-100 text-ink-600"
      }`}
    >
      {status}
    </span>
  );
}
