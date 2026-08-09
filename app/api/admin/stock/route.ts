import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { ingredients, stockMovements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { telegramLowStock } from "@/lib/integrations/telegram";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// GET /api/admin/stock - list ingredients with recent movements
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.query.ingredients.findMany({
    orderBy: ingredients.name,
  });
  return NextResponse.json(all);
}

// POST /api/admin/stock - add ingredient OR adjust stock
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    // --- Create new ingredient ---
    if (action === "create") {
      const { name, unit, currentStock, minStockLevel, costPerUnit } = body;
      if (!name?.trim()) {
        return NextResponse.json({ error: "Nama diperlukan" }, { status: 400 });
      }
      const inserted = await db
        .insert(ingredients)
        .values({
          name: name.trim(),
          unit: unit || "pcs",
          currentStock: String(currentStock || 0),
          minStockLevel: String(minStockLevel || 0),
          costPerUnit: costPerUnit ? String(costPerUnit) : null,
        })
        .returning();
      return NextResponse.json(inserted[0], { status: 201 });
    }

    // --- Adjust stock (restock / use / correction) ---
    if (action === "adjust") {
      const { ingredientId, quantity, type, note } = body;
      const qty = parseFloat(quantity);
      if (!ingredientId || isNaN(qty) || qty === 0) {
        return NextResponse.json(
          { error: "Kuantiti tidak sah" },
          { status: 400 }
        );
      }

      const ingredient = await db.query.ingredients.findFirst({
        where: eq(ingredients.id, parseInt(ingredientId)),
      });
      if (!ingredient) {
        return NextResponse.json({ error: "Bahan tidak dijumpai" }, { status: 404 });
      }

      const newStock = parseFloat(ingredient.currentStock) + qty;
      if (newStock < 0) {
        return NextResponse.json(
          { error: "Stok tidak mencukupi" },
          { status: 400 }
        );
      }

      await db
        .update(ingredients)
        .set({ currentStock: newStock.toFixed(2), updatedAt: new Date() })
        .where(eq(ingredients.id, ingredient.id));

      await db.insert(stockMovements).values({
        ingredientId: ingredient.id,
        type: type || (qty > 0 ? "restock" : "usage"),
        quantity: qty.toFixed(2),
        note: note || null,
      });

      // Low stock alert
      if (newStock <= parseFloat(ingredient.minStockLevel)) {
        telegramLowStock({
          ingredientName: ingredient.name,
          currentStock: newStock.toFixed(2),
          unit: ingredient.unit,
          minLevel: ingredient.minStockLevel,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, newStock: newStock.toFixed(2) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Stock error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/stock?id=x
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

  await db.delete(stockMovements).where(eq(stockMovements.ingredientId, parseInt(id)));
  await db.delete(ingredients).where(eq(ingredients.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
