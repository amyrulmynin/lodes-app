import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, withdrawals, users } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all accepted orders
    const acceptedOrders = await db.query.orders.findMany({
      where: eq(orders.status, "accepted"),
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
    };

    return NextResponse.json({
      stats,
      transactions: recentTransactions.slice(0, 20),
    });
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial stats" },
      { status: 500 }
    );
  }
}
