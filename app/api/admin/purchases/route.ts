import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { purchases, suppliers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allPurchases = await db.query.purchases.findMany({
      with: {
        supplier: true,
      },
      orderBy: desc(purchases.createdAt),
    });

    return NextResponse.json(allPurchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, itemName, quantity, unit, unitPrice, totalPrice, purchaseDate, receiptUrl, notes } = body;

    if (!itemName || !quantity || !unitPrice || !totalPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPurchase = await db.insert(purchases).values({
      supplierId: supplierId || null,
      itemName,
      quantity,
      unit: unit || "pcs",
      unitPrice,
      totalPrice,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      receiptUrl: receiptUrl || null,
      notes: notes || null,
    }).returning();

    return NextResponse.json(newPurchase[0], { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
