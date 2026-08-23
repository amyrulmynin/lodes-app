import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { supplierOrders, supplierOrderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, receivedDate, notes } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (receivedDate) updateData.receivedDate = new Date(receivedDate);
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.update(supplierOrders)
      .set(updateData)
      .where(eq(supplierOrders.id, parseInt(params.id)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Supplier order not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating supplier order:", error);
    return NextResponse.json({ error: "Failed to update supplier order" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);

    // Delete items first
    await db.delete(supplierOrderItems).where(eq(supplierOrderItems.supplierOrderId, orderId));

    const deleted = await db.delete(supplierOrders)
      .where(eq(supplierOrders.id, orderId))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Supplier order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier order:", error);
    return NextResponse.json({ error: "Failed to delete supplier order" }, { status: 500 });
  }
}
