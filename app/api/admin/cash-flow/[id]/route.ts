import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cashFlow } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, category, description, amount, referenceId, referenceType, flowDate } = body;

    const updated = await db.update(cashFlow)
      .set({
        type,
        category,
        description,
        amount,
        referenceId,
        referenceType,
        flowDate: flowDate ? new Date(flowDate) : undefined,
      })
      .where(eq(cashFlow.id, parseInt(params.id)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Cash flow entry not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating cash flow entry:", error);
    return NextResponse.json({ error: "Failed to update cash flow entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await db.delete(cashFlow)
      .where(eq(cashFlow.id, parseInt(params.id)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Cash flow entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cash flow entry:", error);
    return NextResponse.json({ error: "Failed to delete cash flow entry" }, { status: 500 });
  }
}
