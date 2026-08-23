import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { withdrawals, users } from "@/db/schema";
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
    const { status, notes } = body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, parseInt(params.id)),
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: "Withdrawal already processed" },
        { status: 400 }
      );
    }

    const updatedWithdrawal = await db
      .update(withdrawals)
      .set({
        status: status as 'accepted' | 'rejected',
        processedAt: new Date(),
        processedBy: parseInt(session.user.id),
        notes: notes || null,
      })
      .where(eq(withdrawals.id, parseInt(params.id)))
      .returning();

    if (status === 'accepted') {
      await db
        .update(users)
        .set({
          commissionBalance: sql`${users.commissionBalance} - ${withdrawal.amount}`,
        })
        .where(eq(users.id, withdrawal.affiliateId));
    }

    return NextResponse.json(updatedWithdrawal[0]);
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to update withdrawal" },
      { status: 500 }
    );
  }
}
