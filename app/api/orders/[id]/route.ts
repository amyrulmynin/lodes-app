import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['accepted', 'rejected', 'out_for_delivery', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(params.id)),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await db
      .update(orders)
      .set({
        status: status as 'accepted' | 'rejected' | 'out_for_delivery' | 'delivered',
        processedAt: new Date(),
        processedBy: parseInt(session.user.id),
      })
      .where(eq(orders.id, parseInt(params.id)))
      .returning();

    if (status === 'accepted') {
      await db
        .update(users)
        .set({
          commissionBalance: sql`${users.commissionBalance} + ${order.commissionAmount}`,
        })
        .where(eq(users.id, order.affiliateId));
    }

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
