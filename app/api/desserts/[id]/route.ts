import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { desserts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, imageUrl, commissionRate, isActive } = body;

    const updated = await db
      .update(desserts)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: price.toString() }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(commissionRate && { commissionRate: commissionRate.toString() }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(desserts.id, parseInt(params.id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update dessert" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(desserts)
      .set({ isActive: 0 })
      .where(eq(desserts.id, parseInt(params.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete dessert" },
      { status: 500 }
    );
  }
}
