import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { supplierOrders, supplierOrderItems, suppliers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allOrders = await db.query.supplierOrders.findMany({
      with: {
        supplier: true,
        items: true,
      },
      orderBy: desc(supplierOrders.createdAt),
    });

    return NextResponse.json(allOrders);
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    return NextResponse.json({ error: "Failed to fetch supplier orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, orderNumber, items, expectedDate, notes } = body;

    if (!supplierId || !orderNumber || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice), 0);

    const newOrder = await db.insert(supplierOrders).values({
      supplierId,
      orderNumber,
      totalAmount: totalAmount.toFixed(2),
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      notes,
    }).returning();

    const orderItems = items.map((item: any) => ({
      supplierOrderId: newOrder[0].id,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit || "pcs",
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    await db.insert(supplierOrderItems).values(orderItems);

    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error("Error creating supplier order:", error);
    return NextResponse.json({ error: "Failed to create supplier order" }, { status: 500 });
  }
}
