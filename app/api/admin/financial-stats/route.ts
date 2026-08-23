import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, agents, cashFlow, founderSalaries, purchases, supplierOrders } from "@/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";

// Statuses that count as real sales (not pending, not rejected)
const SALES_STATUSES = ["accepted", "out_for_delivery", "delivered"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all completed/in-progress sales orders
    const acceptedOrders = await db.query.orders.findMany({
      where: inArray(orders.status, [...SALES_STATUSES]),
      with: {
        agent: true,
        dessert: true,
      },
    });

    // Get all cash flow entries
    const allCashFlow = await db.query.cashFlow.findMany({
      orderBy: desc(cashFlow.createdAt),
    });

    // Get all founder salaries
    const allSalaries = await db.query.founderSalaries.findMany({
      orderBy: desc(founderSalaries.createdAt),
    });

    // Get all purchases
    const allPurchases = await db.query.purchases.findMany({
      orderBy: desc(purchases.createdAt),
    });

    // Get all supplier orders
    const allSupplierOrders = await db.query.supplierOrders.findMany({
      orderBy: desc(supplierOrders.createdAt),
    });

    // Get pending orders count
    const pendingOrdersCount = await db.query.orders.findMany({
      where: eq(orders.status, "pending"),
    });

    // Calculate total revenue (from accepted orders)
    const totalRevenue = acceptedOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalPrice),
      0
    );

    // Calculate cash in/out from cash_flow table
    const cashIn = allCashFlow
      .filter((c) => c.type === "in")
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const cashOut = allCashFlow
      .filter((c) => c.type === "out")
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);

    // Calculate total salaries
    const totalSalaries = allSalaries.reduce(
      (sum, s) => sum + parseFloat(s.amount),
      0
    );

    // Calculate total purchases
    const totalPurchases = allPurchases.reduce(
      (sum, p) => sum + parseFloat(p.totalPrice),
      0
    );

    // Calculate total supplier orders
    const totalSupplierOrders = allSupplierOrders.reduce(
      (sum, so) => sum + parseFloat(so.totalAmount),
      0
    );

    // Net profit = revenue - purchases - salaries
    const netProfit = totalRevenue - totalPurchases - totalSalaries;

    // ===== Chart data: last 12 months =====
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const chartData = [];
    let thisMonthOrders = 0;
    let lastMonthOrders = 0;

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();

      const monthOrders = acceptedOrders.filter((o) => {
        const od = new Date(o.submittedAt);
        return od.getFullYear() === y && od.getMonth() === m;
      });

      const revenue = monthOrders.reduce((s, o) => s + parseFloat(o.totalPrice), 0);

      // Expenses for this month (purchases + salaries)
      const monthPurchases = allPurchases.filter((p) => {
        const pd = new Date(p.purchaseDate);
        return pd.getFullYear() === y && pd.getMonth() === m;
      }).reduce((s, p) => s + parseFloat(p.totalPrice), 0);

      const monthSalaries = allSalaries.filter((s) => {
        const sd = new Date(s.paidAt);
        return sd.getFullYear() === y && sd.getMonth() === m;
      }).reduce((s, sal) => s + parseFloat(sal.amount), 0);

      const expenses = monthPurchases + monthSalaries;

      if (i === 0) thisMonthOrders = monthOrders.length;
      if (i === 1) lastMonthOrders = monthOrders.length;

      chartData.push({
        month: monthNames[m],
        revenue: parseFloat(revenue.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        orders: monthOrders.length,
      });
    }

    // MoM change for total orders
    const ordersChange =
      lastMonthOrders === 0
        ? thisMonthOrders > 0
          ? 100
          : 0
        : parseFloat((((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1));

    // Daily orders for current month (sparkline)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const sparkline: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const count = acceptedOrders.filter((o) => {
        const od = new Date(o.submittedAt);
        return (
          od.getFullYear() === now.getFullYear() &&
          od.getMonth() === now.getMonth() &&
          od.getDate() === day
        );
      }).length;
      sparkline.push(count);
    }

    // ===== Top desserts by revenue =====
    const dessertMap = new Map<number, { name: string; units: number; revenue: number }>();
    for (const o of acceptedOrders) {
      const key = o.dessertId;
      const existing = dessertMap.get(key) || {
        name: o.dessert?.name || "Unknown",
        units: 0,
        revenue: 0,
      };
      existing.units += o.quantity;
      existing.revenue += parseFloat(o.totalPrice);
      dessertMap.set(key, existing);
    }
    const topDesserts = Array.from(dessertMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ===== Top agents by revenue =====
    const agentMap = new Map<number, { name: string; orders: number; revenue: number }>();
    for (const o of acceptedOrders) {
      if (!o.agentId) continue;
      const key = o.agentId;
      const existing = agentMap.get(key) || {
        name: o.agent?.name || "Unknown",
        orders: 0,
        revenue: 0,
      };
      existing.orders += 1;
      existing.revenue += parseFloat(o.totalPrice);
      agentMap.set(key, existing);
    }
    const topAgents = Array.from(agentMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Prepare recent transactions (last 20)
    const recentTransactions = [];

    // Add orders as transactions
    for (const order of acceptedOrders.slice(0, 10)) {
      recentTransactions.push({
        id: order.id,
        type: "order" as const,
        date: order.submittedAt,
        description: `Order #${order.id} - ${order.dessert?.name || "Unknown"}`,
        amount: order.totalPrice,
        status: order.status,
        source: order.agent?.name || "Direct",
      });
    }

    // Add cash flow as transactions
    for (const entry of allCashFlow.slice(0, 10)) {
      recentTransactions.push({
        id: entry.id,
        type: entry.type as "in" | "out",
        date: entry.flowDate,
        description: entry.description,
        amount: entry.amount,
        status: entry.type,
        source: entry.category,
      });
    }

    // Sort by date and take last 20
    recentTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const stats = {
      totalRevenue: totalRevenue.toFixed(2),
      cashIn: cashIn.toFixed(2),
      cashOut: cashOut.toFixed(2),
      totalSalaries: totalSalaries.toFixed(2),
      totalPurchases: totalPurchases.toFixed(2),
      totalSupplierOrders: totalSupplierOrders.toFixed(2),
      netProfit: netProfit.toFixed(2),
      pendingOrders: pendingOrdersCount.length,
      acceptedOrders: acceptedOrders.length,
      totalAgents: await db.query.agents.findMany().then(a => a.length),
      totalOrders: acceptedOrders.length + pendingOrdersCount.length,
      ordersChange,
    };

    return NextResponse.json({
      stats,
      transactions: recentTransactions.slice(0, 20),
      chartData,
      sparkline,
      topDesserts,
      topAgents,
    });
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial stats" },
      { status: 500 }
    );
  }
}
