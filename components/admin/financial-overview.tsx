"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, ShoppingCart, Users } from "lucide-react";
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || "0")}</p>
              </div>
            </div>
            <p className="text-xs opacity-75 mt-2">From all accepted orders</p>
          </CardContent>
        </Card>

        {/* Total Commissions Paid */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Commissions Paid</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.totalWithdrawals || "0")}</p>
              </div>
            </div>
            <p className="text-xs opacity-75 mt-2">Total withdrawals processed</p>
          </CardContent>
        </Card>

        {/* Pending Commissions */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Pending Commissions</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.totalCommissions || "0")}</p>
              </div>
            </div>
            <p className="text-xs opacity-75 mt-2">In affiliate balances</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Net Profit</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.netProfit || "0")}</p>
              </div>
            </div>
            <p className="text-xs opacity-75 mt-2">Revenue - Commissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
                <p className="text-sm text-gray-600">Pending Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.acceptedOrders || 0}</p>
                <p className="text-sm text-gray-600">Accepted Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.pendingWithdrawals || 0}</p>
                <p className="text-sm text-gray-600">Pending Withdrawals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalAffiliates || 0}</p>
                <p className="text-sm text-gray-600">Total Affiliates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Latest financial activities across orders and withdrawals
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Affiliate</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={`${txn.type}-${txn.id}`} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {formatDate(new Date(txn.date))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            txn.type === "order"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {txn.type === "order" ? "💰 Income" : "💸 Payout"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{txn.description}</td>
                      <td className="py-3 px-4 text-sm font-medium">{txn.affiliate}</td>
                      <td className="py-3 px-4 text-sm font-bold">
                        <span className={txn.type === "order" ? "text-green-600" : "text-orange-600"}>
                          {txn.type === "order" ? "+" : "-"}{formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            txn.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : txn.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary-600" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Money In</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders Revenue:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(stats?.totalRevenue || "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Accepted Orders:</span>
                  <span className="font-semibold">{stats?.acceptedOrders || 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Money Out</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commissions Paid:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(stats?.totalWithdrawals || "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Commissions:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(stats?.totalCommissions || "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Net Profit:</span>
              <span className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats?.netProfit || "0")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              (Total Revenue - Commissions Paid)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
