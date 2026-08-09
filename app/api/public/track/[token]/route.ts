import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/public/track/[token] - customer order tracking (no auth)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.trackingToken, token),
      with: { dessert: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      dessertName: order.dessert?.name || "Dessert",
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      customerName: order.customerName,
      status: order.status,
      paymentStatus: order.paymentStatus,
      submittedAt: order.submittedAt,
      paidAt: order.paidAt,
    });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
