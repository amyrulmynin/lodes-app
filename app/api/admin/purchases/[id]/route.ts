import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, itemName, quantity, unit, unitPrice, totalPrice, purchaseDate, receiptUrl, notes } = body;

    const updated = await db.update(purchases)
      .set({
        supplierId: supplierId || null,
        itemName,
        quantity,
        unit,
        unitPrice,
        totalPrice,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        receiptUrl,
        notes,
      })
      .where(eq(purchases.id, parseInt(params.id)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await db.delete(purchases)
      .where(eq(purchases.id, parseInt(params.id)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json({ error: "Failed to delete purchase" }, { status: 500 });
  }
}
