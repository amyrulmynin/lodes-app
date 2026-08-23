"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Users,
  ArrowUp,
  ArrowDown,
  Trophy,
  Banknote,
  ShoppingBag,
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
import { formatCurrency } from "@/lib/utils";

interface FinancialStats {
  totalRevenue: string;
  cashIn: string;
  cashOut: string;
  totalSalaries: string;
  totalPurchases: string;
  totalSupplierOrders: string;
  netProfit: string;
  pendingOrders: number;
  acceptedOrders: number;
  totalAgents: number;
  totalOrders: number;
  ordersChange: number;
}

interface ChartPoint {
  month: string;
  revenue: number;
  expenses: number;
  orders: number;
}

interface TopDessert {
  name: string;
  units: number;
  revenue: number;
}

interface TopAgent {
  name: string;
  orders: number;
  revenue: number;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-emerald-50 text-emerald-700",
    pending: "bg-primary-100 text-primary-800",
    rejected: "bg-red-50 text-red-700",
    out_for_delivery: "bg-blue-50 text-blue-700",
    delivered: "bg-emerald-100 text-emerald-800",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    out_for_delivery: "Dihantar",
    delivered: "Sampai",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-ink-100 text-ink-600"
      }`}
    >
      {labels[status] || status}
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
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [topDesserts, setTopDesserts] = useState<TopDessert[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
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
        setChartData(data.chartData || []);
        setSparkline(data.sparkline || []);
        setTopDesserts(data.topDesserts || []);
        setTopAgents(data.topAgents || []);
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
      label: "Total Purchases",
      value: formatCurrency(stats?.totalPurchases || "0"),
      icon: ShoppingBag,
    },
    {
      label: "Active Agents",
      value: String(stats?.totalAgents || 0),
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

      {/* ===== Row 2: Cash Flow Summary + Top Desserts ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow Summary (featured) */}
        <Card className="lg:col-span-2 bg-ink-950 border-ink-950 text-white relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-500/15 blur-3xl pointer-events-none"
          />
          <CardHeader className="relative">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg text-white">
                  Cash Flow Overview
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
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Masuk
                </span>
                <span className="flex items-center gap-1.5 text-ink-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Keluar
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative pb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-ink-400 mb-1">Duit Masuk</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(stats?.cashIn || "0")}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-ink-400 mb-1">Duit Keluar</p>
                <p className="text-xl font-bold text-red-400 tabular-nums">
                  {formatCurrency(stats?.cashOut || "0")}
                </p>
              </div>
            </div>
            <div className="h-48 -mx-2">
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
                      name === "revenue" ? "Revenue" : "Expenses",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#ef4444"
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

      {/* ===== Row 3: Customer Orders sparkline + Top Agents ===== */}
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

        {/* Top Agents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Agents</CardTitle>
            <p className="text-sm text-ink-500">
              Agent dengan jualan tertinggi
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topAgents.length === 0 && (
                <p className="text-sm text-ink-400 text-center py-8">
                  Tiada data agent lagi
                </p>
              )}
              {topAgents.map((agent, index) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-3 py-3 border-b border-ink-100 last:border-0"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm flex-shrink-0 ${
                      index === 0
                        ? "bg-ink-950 text-primary-400"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-950 truncate">
                      {agent.name}
                    </p>
                    <p className="text-xs text-ink-400 tabular-nums">
                      {agent.orders} orders
                    </p>
                  </div>
                  <p className="font-bold text-sm text-ink-950 tabular-nums">
                    {formatCurrency(agent.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Row 4: Expenses Summary ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gaji Founder</CardTitle>
            <p className="text-sm text-ink-500">
              Jumlah gaji dibayar
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Banknote className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-2xl font-bold tracking-tight text-red-600 tabular-nums">
                  {formatCurrency(stats?.totalSalaries || "0")}
                </p>
                <p className="text-xs text-ink-400">Total gaji founder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Belian Barang</CardTitle>
            <p className="text-sm text-ink-500">
              Jumlah perbelanjaan stok
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-2xl font-bold tracking-tight text-blue-600 tabular-nums">
                  {formatCurrency(stats?.totalPurchases || "0")}
                </p>
                <p className="text-xs text-ink-400">Total belian barang</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplier Orders</CardTitle>
            <p className="text-sm text-ink-500">
              Jumlah order kepada supplier
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShoppingCart className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
                  {formatCurrency(stats?.totalSupplierOrders || "0")}
                </p>
                <p className="text-xs text-ink-400">Total supplier orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
