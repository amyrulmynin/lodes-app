import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { founderSalaries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { founderName, amount, salaryMonth, paidAt, notes } = body;

    const updated = await db.update(founderSalaries)
      .set({
        founderName,
        amount,
        salaryMonth,
        paidAt: paidAt ? new Date(paidAt) : undefined,
        notes,
      })
      .where(eq(founderSalaries.id, parseInt(params.id)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Salary not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating salary:", error);
    return NextResponse.json({ error: "Failed to update salary" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await db.delete(founderSalaries)
      .where(eq(founderSalaries.id, parseInt(params.id)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Salary not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting salary:", error);
    return NextResponse.json({ error: "Failed to delete salary" }, { status: 500 });
  }
}
