import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, withdrawals, users } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

// Statuses that count as real sales (not pending, not rejected)
const SALES_STATUSES = ["accepted", "out_for_delivery", "delivered"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all completed/in-progress sales orders (accepted + out_for_delivery + delivered)
    const acceptedOrders = await db.query.orders.findMany({
      where: inArray(orders.status, [...SALES_STATUSES]),
      with: {
        affiliate: true,
        dessert: true,
      },
    });

    // Get all withdrawals
    const allWithdrawals = await db.query.withdrawals.findMany({
      with: {
        affiliate: true,
      },
      orderBy: desc(withdrawals.requestedAt),
    });

    // Get all affiliates
    const allAffiliates = await db.query.users.findMany({
      where: eq(users.role, "affiliate"),
    });

    // Get pending orders and withdrawals
    const pendingOrdersCount = await db.query.orders.findMany({
      where: eq(orders.status, "pending"),
    });

    const pendingWithdrawalsData = allWithdrawals.filter(w => w.status === "pending");

    // Calculate total revenue (from accepted orders)
    const totalRevenue = acceptedOrders.reduce(
      (sum, order) => sum + parseFloat(order.totalPrice),
      0
    );

    // Calculate total commissions paid (from accepted withdrawals)
    const totalWithdrawals = allWithdrawals
      .filter(w => w.status === "accepted")
      .reduce((sum, w) => sum + parseFloat(w.amount), 0);

    // Calculate pending commissions (total commission balance of all affiliates)
    const totalCommissions = allAffiliates.reduce(
      (sum, affiliate) => sum + parseFloat(affiliate.commissionBalance),
      0
    );

    // Calculate net profit
    const netProfit = totalRevenue - totalWithdrawals;

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
      const commission = monthOrders.reduce((s, o) => s + parseFloat(o.commissionAmount), 0);

      if (i === 0) thisMonthOrders = monthOrders.length;
      if (i === 1) lastMonthOrders = monthOrders.length;

      chartData.push({
        month: monthNames[m],
        revenue: parseFloat(revenue.toFixed(2)),
        commission: parseFloat(commission.toFixed(2)),
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

    // ===== Top affiliates by revenue =====
    const affiliateMap = new Map<number, { name: string; orders: number; revenue: number }>();
    for (const o of acceptedOrders) {
      const key = o.affiliateId;
      const existing = affiliateMap.get(key) || {
        name: o.affiliate?.name || "Unknown",
        orders: 0,
        revenue: 0,
      };
      existing.orders += 1;
      existing.revenue += parseFloat(o.totalPrice);
      affiliateMap.set(key, existing);
    }
    const topAffiliates = Array.from(affiliateMap.values())
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
        affiliate: order.affiliate?.name || "Unknown",
      });
    }

    // Add withdrawals as transactions
    for (const withdrawal of allWithdrawals.slice(0, 10)) {
      recentTransactions.push({
        id: withdrawal.id,
        type: "withdrawal" as const,
        date: withdrawal.requestedAt,
        description: `Withdrawal #${withdrawal.id} - Commission Payout`,
        amount: withdrawal.amount,
        status: withdrawal.status,
        affiliate: withdrawal.affiliate?.name || "Unknown",
      });
    }

    // Sort by date and take last 20
    recentTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const stats = {
      totalRevenue: totalRevenue.toFixed(2),
      totalCommissions: totalCommissions.toFixed(2),
      totalWithdrawals: totalWithdrawals.toFixed(2),
      netProfit: netProfit.toFixed(2),
      pendingOrders: pendingOrdersCount.length,
      acceptedOrders: acceptedOrders.length,
      pendingWithdrawals: pendingWithdrawalsData.length,
      totalAffiliates: allAffiliates.length,
      totalOrders: acceptedOrders.length + pendingOrdersCount.length,
      ordersChange,
    };

    return NextResponse.json({
      stats,
      transactions: recentTransactions.slice(0, 20),
      chartData,
      sparkline,
      topDesserts,
      topAffiliates,
    });
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial stats" },
      { status: 500 }
    );
  }
}
