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
  ArrowUp,
  ArrowDown,
  CakeSlice,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
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
  totalOrders: number;
  ordersChange: number;
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

interface ChartPoint {
  month: string;
  revenue: number;
  commission: number;
  orders: number;
}

interface TopDessert {
  name: string;
  units: number;
  revenue: number;
}

interface TopAffiliate {
  name: string;
  orders: number;
  revenue: number;
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

function ChangePill({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        positive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {positive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {value}%
      <span className="font-normal text-ink-400">vs last month</span>
    </span>
  );
}

export function FinancialOverview() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [topDesserts, setTopDesserts] = useState<TopDessert[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
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
        setChartData(data.chartData || []);
        setSparkline(data.sparkline || []);
        setTopDesserts(data.topDesserts || []);
        setTopAffiliates(data.topAffiliates || []);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="skeleton h-80 lg:col-span-2" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || "0"),
      icon: TrendingUp,
    },
    {
      label: "Total Orders",
      value: String(stats?.totalOrders || 0),
      icon: ShoppingCart,
      change: stats?.ordersChange ?? 0,
    },
    {
      label: "Pending Commissions",
      value: formatCurrency(stats?.totalCommissions || "0"),
      icon: Wallet,
    },
    {
      label: "Active Affiliates",
      value: String(stats?.totalAffiliates || 0),
      icon: Users,
    },
  ];

  const sparkData = sparkline.map((count, i) => ({ day: i + 1, orders: count }));

  return (
    <div className="space-y-5">
      {/* ===== Row 1: 4 stat cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="hover:shadow-lift">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-5">
                  <p className="text-sm font-medium text-ink-500">
                    {card.label}
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {card.value}
                </p>
                {card.change !== undefined && (
                  <div className="mt-2">
                    <ChangePill value={card.change} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== Row 2: Profit overview chart + Top Desserts ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Overview (featured) */}
        <Card className="lg:col-span-2 bg-ink-950 border-ink-950 text-white relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-500/15 blur-3xl pointer-events-none"
          />
          <CardHeader className="relative">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg text-white">
                  Revenue Overview
                </CardTitle>
                <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                  <p className="text-3xl font-bold tracking-tight text-primary-400 tabular-nums">
                    {formatCurrency(stats?.netProfit || "0")}
                  </p>
                  <span className="text-xs font-medium text-ink-400">
                    net profit (12 bulan)
                  </span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  Commission
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative pb-4">
            <div className="h-64 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  barGap={3}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff"
                    strokeOpacity={0.08}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#8b8b80", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8b8b80", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff", fillOpacity: 0.06 }}
                    contentStyle={{
                      backgroundColor: "#1d1d1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                    itemStyle={{ color: "#facc15" }}
                    formatter={(value: any, name: any) => [
                      formatCurrency(value),
                      name === "revenue" ? "Revenue" : "Commission",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#facc15"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="commission"
                    fill="#ffffff"
                    fillOpacity={0.25}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Desserts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Desserts</CardTitle>
            <p className="text-sm text-ink-500">
              Jualan tertinggi sepanjang masa
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topDesserts.length === 0 && (
                <p className="text-sm text-ink-400 text-center py-8">
                  Tiada data jualan lagi
                </p>
              )}
              {topDesserts.map((dessert, index) => (
                <div
                  key={dessert.name}
                  className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-0"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm flex-shrink-0 ${
                      index === 0
                        ? "bg-primary-500 text-ink-950"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {index === 0 ? (
                      <Trophy className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      `#${index + 1}`
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-950 truncate">
                      {dessert.name}
                    </p>
                    <p className="text-xs text-ink-400 tabular-nums">
                      {dessert.units} unit terjual
                    </p>
                  </div>
                  <p className="font-bold text-sm text-ink-950 tabular-nums">
                    {formatCurrency(dessert.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Row 3: Customer Orders sparkline + Top Affiliates ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Orders</CardTitle>
            <p className="text-sm text-ink-500">
              Bulan ini ({new Date().toLocaleDateString("ms-MY", { month: "long", year: "numeric" })})
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <p className="text-3xl font-bold tracking-tight text-ink-950 tabular-nums">
                {stats?.acceptedOrders || 0}
              </p>
              <ChangePill value={stats?.ordersChange ?? 0} />
            </div>
            <p className="text-xs text-ink-400 mb-4">
              orders diterima bulan ini
            </p>
            <div className="h-28 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sparkData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="ordersGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#facc15"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="#facc15"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1d1d1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                    itemStyle={{ color: "#facc15" }}
                    formatter={(value: any) => [value, "Orders"]}
                    labelFormatter={(day) => `Hari ${day}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#eab308"
                    strokeWidth={2.5}
                    fill="url(#ordersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Affiliates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Affiliates</CardTitle>
            <p className="text-sm text-ink-500">
              Affiliate dengan jualan tertinggi
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topAffiliates.length === 0 && (
                <p className="text-sm text-ink-400 text-center py-8">
                  Tiada data affiliate lagi
                </p>
              )}
              {topAffiliates.map((affiliate, index) => (
                <div
                  key={affiliate.name}
                  className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-0"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm flex-shrink-0 ${
                      index === 0
                        ? "bg-ink-950 text-primary-400"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {affiliate.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-950 truncate">
                      {affiliate.name}
                    </p>
                    <p className="text-xs text-ink-400 tabular-nums">
                      {affiliate.orders} orders
                    </p>
                  </div>
                  <p className="font-bold text-sm text-ink-950 tabular-nums">
                    {formatCurrency(affiliate.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Row 4: Recent Transactions ===== */}
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
